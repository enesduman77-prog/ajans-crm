package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.GroupConversationResponse;
import com.fogistanbul.crm.dto.GroupConversationResponse.GroupMemberInfo;
import com.fogistanbul.crm.dto.GroupMessageResponse;
import com.fogistanbul.crm.dto.SendMessageRequest;
import com.fogistanbul.crm.entity.*;
import com.fogistanbul.crm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupMessagingService {

    private final GroupConversationRepository groupConversationRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMessageRepository groupMessageRepository;
    private final GroupMessageReadRepository groupMessageReadRepository;
    private final CompanyMembershipRepository companyMembershipRepository;
    private final UserProfileRepository userProfileRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Creates a company group chat and adds the given user as the first member.
     */
    @Transactional
    public GroupConversation createCompanyGroup(Company company, UserProfile firstMember) {
        // Check if group already exists
        Optional<GroupConversation> existing = groupConversationRepository.findByCompanyId(company.getId());
        if (existing.isPresent()) {
            // Just add the member if not already in
            addMemberIfNotExists(existing.get(), firstMember);
            return existing.get();
        }

        GroupConversation group = GroupConversation.builder()
                .name(company.getName() + " Grubu")
                .company(company)
                .avatarUrl(company.getLogoUrl())
                .build();
        group = groupConversationRepository.save(group);

        GroupMember member = GroupMember.builder()
                .group(group)
                .user(firstMember)
                .build();
        groupMemberRepository.save(member);

        return group;
    }

    /**
     * Adds a user to the company's group chat.
     */
    @Transactional
    public void addMemberToCompanyGroup(UUID companyId, UUID userId) {
        groupConversationRepository.findByCompanyId(companyId).ifPresent(group -> {
            UserProfile user = userProfileRepository.findById(userId).orElse(null);
            if (user != null) {
                addMemberIfNotExists(group, user);
            }
        });
    }

    /**
     * Removes a user from the company's group chat.
     */
    @Transactional
    public void removeMemberFromCompanyGroup(UUID companyId, UUID userId) {
        groupConversationRepository.findByCompanyId(companyId).ifPresent(group -> {
            groupMemberRepository.deleteByGroupIdAndUserId(group.getId(), userId);
        });
    }

    private void addMemberIfNotExists(GroupConversation group, UserProfile user) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(group.getId(), user.getId())) {
            GroupMember member = GroupMember.builder()
                    .group(group)
                    .user(user)
                    .build();
            groupMemberRepository.save(member);
        }
    }

    /**
     * Returns all group conversations the user is a member of.
     */
    @Transactional(readOnly = true)
    public List<GroupConversationResponse> getMyGroups(UUID userId) {
        List<GroupMember> memberships = groupMemberRepository.findByUserId(userId);
        if (memberships.isEmpty()) {
            return List.of();
        }

        List<UUID> groupIds = memberships.stream()
                .map(m -> m.getGroup().getId())
                .toList();

        Map<UUID, Long> unreadCounts = groupMessageRepository
                .countUnreadByGroupIds(groupIds, userId)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]));

        return memberships.stream()
                .map(m -> {
                    GroupConversation group = m.getGroup();

                    GroupMessage lastMessage = groupMessageRepository
                            .findFirstByGroupIdOrderByCreatedAtDesc(group.getId())
                            .orElse(null);

                    List<GroupMember> members = groupMemberRepository.findByGroupId(group.getId());

                    return GroupConversationResponse.builder()
                            .id(group.getId().toString())
                            .name(group.getName())
                            .companyId(group.getCompany().getId().toString())
                            .companyName(group.getCompany().getName())
                            .avatarUrl(group.getAvatarUrl())
                            .memberCount(members.size())
                            .unreadCount(unreadCounts.getOrDefault(group.getId(), 0L))
                            .updatedAt(group.getUpdatedAt())
                            .createdAt(group.getCreatedAt())
                            .lastMessage(lastMessage != null ? toMessageResponse(lastMessage) : null)
                            .members(members.stream().map(mem -> {
                                UserProfile u = mem.getUser();
                                var cm = companyMembershipRepository.findByUserIdAndCompanyId(u.getId(), group.getCompany().getId()).orElse(null);
                                return GroupMemberInfo.builder()
                                        .userId(u.getId().toString())
                                        .fullName(u.getPerson() != null ? u.getPerson().getFullName() : u.getEmail())
                                        .avatarUrl(u.getPerson() != null ? u.getPerson().getAvatarUrl() : null)
                                        .membershipRole(cm != null ? cm.getMembershipRole().name() : null)
                                        .positionTitle(u.getPerson() != null ? u.getPerson().getPositionTitle() : null)
                                        .build();
                            }).toList())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Send a message to a group.
     */
    @Transactional
    public GroupMessageResponse sendMessage(UUID groupId, SendMessageRequest request, UUID senderId) {
        GroupConversation group = groupConversationRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grup bulunamadi"));

        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, senderId)) {
            throw new RuntimeException("Bu gruba mesaj gonderme yetkiniz yok");
        }

        UserProfile sender = userProfileRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));

        GroupMessage message = GroupMessage.builder()
                .group(group)
                .sender(sender)
                .content(request.getContent())
                .build();
        message = groupMessageRepository.save(message);

        group.setUpdatedAt(Instant.now());
        groupConversationRepository.save(group);

        GroupMessageResponse response = toMessageResponse(message);

        // Broadcast to group topic
        messagingTemplate.convertAndSend("/topic/group/" + groupId, response);

        // Notify each member individually
        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);
        for (GroupMember member : members) {
            if (!member.getUser().getId().equals(senderId)) {
                messagingTemplate.convertAndSend("/topic/user/" + member.getUser().getId(), response);
            }
        }

        return response;
    }

    /**
     * Get messages for a group (paginated).
     */
    @Transactional
    public Page<GroupMessageResponse> getMessages(UUID groupId, UUID userId, int page, int size) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new RuntimeException("Bu gruba erisim yetkiniz yok");
        }

        // Mark as read
        groupMessageReadRepository.markAllAsRead(groupId, userId);

        return groupMessageRepository
                .findByGroupIdOrderByCreatedAtAsc(groupId, PageRequest.of(page, size))
                .map(this::toMessageResponse);
    }

    /**
     * Mark all messages in a group as read.
     */
    @Transactional
    public void markAsRead(UUID groupId, UUID userId) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new RuntimeException("Bu gruba erisim yetkiniz yok");
        }
        groupMessageReadRepository.markAllAsRead(groupId, userId);
    }

    private GroupMessageResponse toMessageResponse(GroupMessage message) {
        return GroupMessageResponse.builder()
                .id(message.getId().toString())
                .groupId(message.getGroup().getId().toString())
                .senderId(message.getSender().getId().toString())
                .senderName(message.getSender().getPerson() != null
                        ? message.getSender().getPerson().getFullName()
                        : message.getSender().getEmail())
                .senderAvatarUrl(message.getSender().getPerson() != null
                        ? message.getSender().getPerson().getAvatarUrl()
                        : null)
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
