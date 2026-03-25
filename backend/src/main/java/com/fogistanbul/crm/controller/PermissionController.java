package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.PermissionResponse;
import com.fogistanbul.crm.dto.UpdatePermissionRequest;
import com.fogistanbul.crm.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/permissions")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    public ResponseEntity<List<PermissionResponse>> getPermissions(
            @RequestParam UUID userId,
            @RequestParam UUID companyId) {
        return ResponseEntity.ok(permissionService.getPermissions(userId, companyId));
    }

    @PutMapping
    public ResponseEntity<PermissionResponse> updatePermission(
            @Valid @RequestBody UpdatePermissionRequest request) {
        return ResponseEntity.ok(permissionService.updatePermission(request));
    }

    @GetMapping("/keys")
    public ResponseEntity<List<String>> getAllPermissionKeys() {
        return ResponseEntity.ok(permissionService.getAllPermissionKeys());
    }

    @PostMapping("/defaults")
    public ResponseEntity<Map<String, String>> setDefaults(
            @RequestParam UUID userId,
            @RequestParam UUID companyId,
            @RequestParam String role) {
        permissionService.setDefaultPermissions(userId, companyId, role);
        return ResponseEntity.ok(Map.of("message", "Varsayılan izinler atandı"));
    }
}
