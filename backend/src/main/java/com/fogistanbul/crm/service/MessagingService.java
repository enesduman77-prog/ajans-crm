package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.ContactResponse;
import com.fogistanbul.crm.dto.ConversationResponse;
import com.fogistanbul.crm.dto.MessageResponse;
import com.fogistanbul.crm.dto.SendMessageRequest;
import com.fogistanbul.crm.entity.Conversation;
import com.fogistanbul.crm.entity.Message;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.MembershipRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.ConversationRepository;
import com.fogistanbul.crm.repository.MessageRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessagingService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final CompanyMembershipRepository membershipRepository;
    private final UserProfileRepository userProfileRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ConversationResponse getOrStartConversation(UUID currentUserId, UUID targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new RuntimeException("Kendinizle konusamazsiniz");
        }

        UserProfile currentUser = userProfileRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));
        UserProfile targetUser = userProfileRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));

        // Non-admin users can only start chat with admin or users sharing at least one company.
        if (currentUser.getGlobalRole() != GlobalRole.ADMIN
                && targetUser.getGlobalRole() != GlobalRole.ADMIN
                && !membershipRepository.existsSharedCompany(currentUserId, targetUserId)) {
            throw new RuntimeException("Bu kullaniciyla mesajlasma yetkiniz yok");
        }

        // EMPLOYEE can only message AGENCY_STAFF assigned to their company
        if (currentUser.getGlobalRole() == GlobalRole.COMPANY_USER) {
            boolean isEmployee = membershipRepository.findByUserId(currentUserId).stream()
                    .anyMatch(m -> m.getMembershipRole() == MembershipRole.EMPLOYEE);
            if (isEmployee && targetUser.getGlobalRole() != GlobalRole.ADMIN) {
                boolean targetIsAgencyStaff = membershipRepository.findByUserId(targetUserId).stream()
                        .anyMatch(m -> m.getMembershipRole() == MembershipRole.AGENCY_STAFF);
                if (!targetIsAgencyStaff) {
                    throw new RuntimeException("Sadece size atanmis ajans calisanlarina mesaj atabilirsiniz");
                }
            }
        }

        Conversation conversation = conversationRepository.findByUserIds(currentUserId, targetUserId)
                .orElseGet(() -> {
                    // Use string comparison to match PostgreSQL's UUID ordering (text-based)
                    boolean currentFirst = currentUserId.toString().compareTo(targetUserId.toString()) < 0;
                    Conversation newConvo = Conversation.builder()
                            .user1(currentFirst ? currentUser : targetUser)
                            .user2(currentFirst ? targetUser : currentUser)
                            .build();

                    return conversationRepository.save(newConvo);
                });

        return toConversationResponse(conversation, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getMyConversations(UUID userId) {
        List<Conversation> conversations = conversationRepository.findByUserId(userId);
        if (conversations.isEmpty()) {
            return List.of();
        }

        List<UUID> conversationIds = conversations.stream()
                .map(Conversation::getId)
                .collect(Collectors.toList());

        Map<UUID, Long> messageCounts = messageRepository.countByConversationIds(conversationIds)
                .stream().collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]));

        Map<UUID, Long> unreadCounts = messageRepository
                .countUnreadByConversationIds(conversationIds, userId)
                .stream().collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]));

        // Pre-fetch membership info for other users
        List<UUID> otherUserIds = conversations.stream()
                .map(c -> c.getUser1().getId().equals(userId) ? c.getUser2().getId() : c.getUser1().getId())
                .toList();
        Map<UUID, com.fogistanbul.crm.entity.CompanyMembership> convMembershipMap = membershipRepository
                .findByUserIdIn(otherUserIds).stream()
                .collect(Collectors.toMap(m -> m.getUser().getId(), m -> m, (a, b) -> a));

        return conversations.stream()
                .map(c -> {
                    UserProfile otherUser = c.getUser1().getId().equals(userId)
                            ? c.getUser2()
                            : c.getUser1();

                    Message lastMessage = messageRepository
                            .findFirstByConversationIdOrderByCreatedAtDesc(c.getId())
                            .orElse(null);

                    var mb = convMembershipMap.get(otherUser.getId());

                    return ConversationResponse.builder()
                            .id(c.getId().toString())
                            .otherUserId(otherUser.getId().toString())
                            .otherUserName(otherUser.getPerson() != null
                                    ? otherUser.getPerson().getFullName()
                                    : otherUser.getEmail())
                            .otherUserAvatarUrl(otherUser.getPerson() != null
                                    ? otherUser.getPerson().getAvatarUrl()
                                    : null)
                            .otherUserRole(otherUser.getGlobalRole().name())
                            .otherUserCompanyName(mb != null ? mb.getCompany().getName() : null)
                            .otherUserMembershipRole(mb != null ? mb.getMembershipRole().name() : null)
                            .otherUserPositionTitle(otherUser.getPerson() != null ? otherUser.getPerson().getPositionTitle() : null)
                            .updatedAt(c.getUpdatedAt())
                            .createdAt(c.getCreatedAt())
                            .messageCount(messageCounts.getOrDefault(c.getId(), 0L))
                            .unreadCount(unreadCounts.getOrDefault(c.getId(), 0L))
                            .lastMessage(lastMessage != null ? toMessageResponse(lastMessage) : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse sendMessage(UUID conversationId, SendMessageRequest request, UUID senderId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Konusma bulunamadi"));

        if (!conversation.getUser1().getId().equals(senderId)
                && !conversation.getUser2().getId().equals(senderId)) {
            throw new RuntimeException("Bu konusmaya katilim yetkiniz yok");
        }

        UserProfile sender = userProfileRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getContent())
                .isApprovalPending(request.isRequiresApproval())
                .isRead(false)
                .build();

        message = messageRepository.save(message);

        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        MessageResponse response = toMessageResponse(message);
        log.info("Message sent in conversation {} by user {}", conversationId, senderId);

        messagingTemplate.convertAndSend("/topic/thread/" + conversationId, response);

        UUID otherUserId = conversation.getUser1().getId().equals(senderId)
                ? conversation.getUser2().getId()
                : conversation.getUser1().getId();
        messagingTemplate.convertAndSend("/topic/user/" + otherUserId, response);

        return response;
    }

    @Transactional
    public Page<MessageResponse> getMessages(UUID conversationId, UUID userId, int page, int size) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Konusma bulunamadi"));

        if (!conversation.getUser1().getId().equals(userId)
                && !conversation.getUser2().getId().equals(userId)) {
            throw new RuntimeException("Bu konusmaya erisim yetkiniz yok");
        }

        int markedCount = messageRepository.markAsReadByConversationAndNotSender(conversationId, userId);

        if (markedCount > 0) {
            messagingTemplate.convertAndSend("/topic/read/" + conversationId,
                    Map.of("conversationId", conversationId.toString(), "readBy", userId.toString()));
        }

        return messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId, PageRequest.of(page, size))
                .map(this::toMessageResponse);
    }

    @Transactional
    public void markConversationAsRead(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Konusma bulunamadi"));

        if (!conversation.getUser1().getId().equals(userId)
                && !conversation.getUser2().getId().equals(userId)) {
            throw new RuntimeException("Bu konusmaya erisim yetkiniz yok");
        }

        int markedCount = messageRepository.markAsReadByConversationAndNotSender(conversationId, userId);

        if (markedCount > 0) {
            messagingTemplate.convertAndSend("/topic/read/" + conversationId,
                    Map.of("conversationId", conversationId.toString(), "readBy", userId.toString()));
        }
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> getContacts(UUID userId) {
        UserProfile currentUser = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));

        List<UserProfile> contacts;
        if (currentUser.getGlobalRole() == GlobalRole.ADMIN) {
            contacts = userProfileRepository.findByIdNot(userId);
        } else {
            List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
            if (companyIds.isEmpty()) {
                return List.of();
            }

            List<UUID> allowedUserIds;

            // EMPLOYEE can only message AGENCY_STAFF assigned to their company
            boolean isEmployee = currentUser.getGlobalRole() == GlobalRole.COMPANY_USER
                    && membershipRepository.findByUserId(userId).stream()
                            .anyMatch(m -> m.getMembershipRole() == MembershipRole.EMPLOYEE);

            if (isEmployee) {
                allowedUserIds = membershipRepository.findAgencyStaffUserIdsByCompanyIds(companyIds)
                        .stream()
                        .filter(id -> !id.equals(userId))
                        .toList();
            } else {
                allowedUserIds = membershipRepository.findDistinctUserIdsByCompanyIds(companyIds)
                        .stream()
                        .filter(id -> !id.equals(userId))
                        .toList();
            }

            if (allowedUserIds.isEmpty()) {
                return List.of();
            }
            contacts = userProfileRepository.findAllById(allowedUserIds);
        }

        // Pre-fetch membership info for all contact user IDs
        List<UUID> contactUserIds = contacts.stream().map(UserProfile::getId).toList();
        Map<UUID, com.fogistanbul.crm.entity.CompanyMembership> membershipMap = membershipRepository
                .findByUserIdIn(contactUserIds).stream()
                .collect(Collectors.toMap(
                        m -> m.getUser().getId(),
                        m -> m,
                        (a, b) -> a // if multiple memberships, take first
                ));

        return contacts.stream()
                .map(u -> {
                    var mb = membershipMap.get(u.getId());
                    return ContactResponse.builder()
                            .id(u.getId().toString())
                            .fullName(u.getPerson() != null ? u.getPerson().getFullName() : u.getEmail())
                            .email(u.getEmail())
                            .globalRole(u.getGlobalRole().name())
                            .avatarUrl(u.getPerson() != null ? u.getPerson().getAvatarUrl() : null)
                            .companyName(mb != null ? mb.getCompany().getName() : null)
                            .membershipRole(mb != null ? mb.getMembershipRole().name() : null)
                            .positionTitle(u.getPerson() != null ? u.getPerson().getPositionTitle() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private ConversationResponse toConversationResponse(Conversation conversation, UUID currentUserId) {
        UserProfile otherUser = conversation.getUser1().getId().equals(currentUserId)
                ? conversation.getUser2()
                : conversation.getUser1();

        long messageCount = messageRepository.countByConversationId(conversation.getId());
        long unreadCount = messageRepository
                .countByConversationIdAndIsReadFalseAndSenderIdNot(conversation.getId(), currentUserId);

        Message lastMessage = messageRepository
                .findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId())
                .orElse(null);

        var mb = membershipRepository.findByUserId(otherUser.getId()).stream().findFirst().orElse(null);

        return ConversationResponse.builder()
                .id(conversation.getId().toString())
                .otherUserId(otherUser.getId().toString())
                .otherUserName(otherUser.getPerson() != null ? otherUser.getPerson().getFullName() : otherUser.getEmail())
                .otherUserAvatarUrl(otherUser.getPerson() != null ? otherUser.getPerson().getAvatarUrl() : null)
                .otherUserRole(otherUser.getGlobalRole().name())
                .otherUserCompanyName(mb != null ? mb.getCompany().getName() : null)
                .otherUserMembershipRole(mb != null ? mb.getMembershipRole().name() : null)
                .otherUserPositionTitle(otherUser.getPerson() != null ? otherUser.getPerson().getPositionTitle() : null)
                .updatedAt(conversation.getUpdatedAt())
                .createdAt(conversation.getCreatedAt())
                .messageCount(messageCount)
                .unreadCount(unreadCount)
                .lastMessage(lastMessage != null ? toMessageResponse(lastMessage) : null)
                .build();
    }

    private MessageResponse toMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId().toString())
                .conversationId(message.getConversation().getId().toString())
                .senderId(message.getSender().getId().toString())
                .senderName(message.getSender().getPerson() != null
                        ? message.getSender().getPerson().getFullName()
                        : message.getSender().getEmail())
                .senderAvatarUrl(message.getSender().getPerson() != null
                        ? message.getSender().getPerson().getAvatarUrl()
                        : null)
                .content(message.getContent())
                .isRead(message.getIsRead() != null ? message.getIsRead() : false)
                .approvalPending(message.getIsApprovalPending() != null ? message.getIsApprovalPending() : false)
                .createdAt(message.getCreatedAt())
                .build();
    }
}
