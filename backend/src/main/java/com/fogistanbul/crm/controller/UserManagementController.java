package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.entity.CompanyMembership;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
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
}
