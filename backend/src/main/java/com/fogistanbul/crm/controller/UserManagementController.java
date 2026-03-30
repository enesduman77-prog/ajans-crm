package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.entity.CompanyMembership;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserProfileRepository userProfileRepository;
    private final CompanyMembershipRepository membershipRepository;
    private final EntityManager entityManager;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserProfile> users = userProfileRepository.findAll();
        List<UUID> userIds = users.stream().map(UserProfile::getId).toList();

        Map<UUID, List<CompanyMembership>> membershipMap = membershipRepository
                .findByUserIdIn(userIds).stream()
                .collect(Collectors.groupingBy(m -> m.getUser().getId()));

        List<UserResponse> result = users.stream().map(u -> {
            List<CompanyMembership> memberships = membershipMap.getOrDefault(u.getId(), List.of());
            List<UserCompanyInfo> companies = memberships.stream()
                    .map(m -> new UserCompanyInfo(
                            m.getCompany().getId().toString(),
                            m.getCompany().getName(),
                            m.getMembershipRole().name()
                    )).toList();

            String membershipRole = memberships.isEmpty() ? null : memberships.get(0).getMembershipRole().name();

            return new UserResponse(
                    u.getId().toString(),
                    u.getPerson() != null ? u.getPerson().getFullName() : u.getEmail(),
                    u.getEmail(),
                    u.getGlobalRole().name(),
                    membershipRole,
                    u.getPerson() != null ? u.getPerson().getAvatarUrl() : null,
                    u.getPerson() != null ? u.getPerson().getPhone() : null,
                    u.getPerson() != null ? u.getPerson().getPositionTitle() : null,
                    u.getPerson() != null ? u.getPerson().getDepartment() : null,
                    companies,
                    u.getCreatedAt()
            );
        }).toList();

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable UUID id, @RequestBody UpdateRoleRequest request) {
        UserProfile user = userProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        try {
            GlobalRole newRole = GlobalRole.valueOf(request.globalRole());
            user.setGlobalRole(newRole);
            userProfileRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Rol güncellendi"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Geçersiz rol"));
        }
    }

    public record UserResponse(
            String id,
            String fullName,
            String email,
            String globalRole,
            String membershipRole,
            String avatarUrl,
            String phone,
            String position,
            String department,
            List<UserCompanyInfo> companies,
            Instant createdAt
    ) {}

    public record UserCompanyInfo(
            String companyId,
            String companyName,
            String membershipRole
    ) {}

    public record UpdateRoleRequest(String globalRole) {}

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        UserProfile user = userProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("message", "Admin kullanıcıları silinemez"));
        }

        // Clean all FK references
        entityManager.createNativeQuery("DELETE FROM activity_logs WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM approval_requests WHERE requester_id = :uid OR approver_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM company_memberships WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM company_permissions WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM message_read_receipts WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM messages WHERE sender_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user1_id = :uid OR user2_id = :uid)").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM conversations WHERE user1_id = :uid OR user2_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM messages_threads WHERE created_by = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM file_attachments WHERE uploaded_by = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM group_message_reads WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM group_members WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM group_messages WHERE sender_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM meeting_participants WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("UPDATE meetings SET created_by = NULL WHERE created_by = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM notes WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM notification_preferences WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM notifications WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM pr_project_members WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("UPDATE pr_projects SET created_by = NULL WHERE created_by = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM refresh_tokens WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM satisfaction_surveys WHERE submitted_by = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM shoot_participants WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("UPDATE shoots SET created_by = NULL WHERE created_by = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM task_reviews WHERE reviewer_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM time_entries WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("UPDATE tasks SET assigned_to = NULL WHERE assigned_to = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("UPDATE tasks SET created_by = NULL WHERE created_by = :uid").setParameter("uid", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM google_oauth_tokens WHERE user_id = :uid").setParameter("uid", id).executeUpdate();
        entityManager.flush();

        // Delete person if exists
        if (user.getPerson() != null) {
            entityManager.createNativeQuery("DELETE FROM persons WHERE id = :pid").setParameter("pid", user.getPerson().getId()).executeUpdate();
        }

        userProfileRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "Kullanıcı silindi"));
    }
}
