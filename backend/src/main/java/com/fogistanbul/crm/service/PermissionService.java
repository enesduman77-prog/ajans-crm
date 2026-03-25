package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.PermissionResponse;
import com.fogistanbul.crm.dto.UpdatePermissionRequest;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.CompanyPermission;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.PermissionLevel;
import com.fogistanbul.crm.repository.CompanyPermissionRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final CompanyPermissionRepository permissionRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyRepository companyRepository;

    private static final List<String> ALL_PERMISSION_KEYS = List.of(
            "messages.general.write",
            "messages.dm.start",
            "messages.dm.write",
            "tasks.view",
            "tasks.create",
            "tasks.update",
            "calendar.view",
            "calendar.create",
            "meetings.request",
            "reports.view",
            "pr.view",
            "pr.create",
            "shoots.view",
            "shoots.create",
            "panel.dashboard",
            "panel.companies",
            "panel.completed_tasks");

    @Transactional(readOnly = true)
    public List<PermissionResponse> getPermissions(UUID userId, UUID companyId) {
        List<CompanyPermission> existing = permissionRepository.findByUserIdAndCompanyId(userId, companyId);

        Map<String, CompanyPermission> permMap = existing.stream()
                .collect(Collectors.toMap(CompanyPermission::getPermissionKey, p -> p));

        return ALL_PERMISSION_KEYS.stream().map(key -> {
            CompanyPermission perm = permMap.get(key);
            return PermissionResponse.builder()
                    .id(perm != null ? perm.getId().toString() : null)
                    .userId(userId.toString())
                    .companyId(companyId.toString())
                    .permissionKey(key)
                    .level(perm != null ? perm.getLevel().name() : "NONE")
                    .createdAt(perm != null && perm.getCreatedAt() != null ? perm.getCreatedAt().toString() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public PermissionResponse updatePermission(UpdatePermissionRequest req) {
        UserProfile user = userProfileRepository.findById(req.getUserId())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        Company company = companyRepository.findById(req.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Şirket bulunamadı"));

        PermissionLevel level = PermissionLevel.valueOf(req.getLevel());

        CompanyPermission permission = permissionRepository
                .findByUserIdAndCompanyIdAndPermissionKey(req.getUserId(), req.getCompanyId(), req.getPermissionKey())
                .orElse(null);

        if (permission == null) {
            permission = CompanyPermission.builder()
                    .user(user)
                    .company(company)
                    .permissionKey(req.getPermissionKey())
                    .level(level)
                    .build();
        } else {
            permission.setLevel(level);
        }

        permission = permissionRepository.save(permission);

        return PermissionResponse.builder()
                .id(permission.getId().toString())
                .userId(req.getUserId().toString())
                .companyId(req.getCompanyId().toString())
                .permissionKey(req.getPermissionKey())
                .level(permission.getLevel().name())
                .createdAt(permission.getCreatedAt() != null ? permission.getCreatedAt().toString() : null)
                .build();
    }

    @Transactional
    public void setDefaultPermissions(UUID userId, UUID companyId, String role) {
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Şirket bulunamadı"));

        Map<String, PermissionLevel> defaults;

        if ("OWNER".equals(role)) {
            defaults = ALL_PERMISSION_KEYS.stream()
                    .collect(Collectors.toMap(k -> k, k -> PermissionLevel.FULL));
        } else if ("EMPLOYEE".equals(role)) {
            defaults = new HashMap<>();
            defaults.put("messages.general.write", PermissionLevel.FULL);
            defaults.put("tasks.view", PermissionLevel.FULL);
            defaults.put("panel.dashboard", PermissionLevel.FULL);
            defaults.put("calendar.view", PermissionLevel.FULL);
        } else {
            defaults = new HashMap<>();
        }

        for (Map.Entry<String, PermissionLevel> entry : defaults.entrySet()) {
            CompanyPermission perm = permissionRepository
                    .findByUserIdAndCompanyIdAndPermissionKey(userId, companyId, entry.getKey())
                    .orElse(CompanyPermission.builder()
                            .user(user)
                            .company(company)
                            .permissionKey(entry.getKey())
                            .build());

            perm.setLevel(entry.getValue());
            permissionRepository.save(perm);
        }
    }

    public List<String> getAllPermissionKeys() {
        return ALL_PERMISSION_KEYS;
    }
}
