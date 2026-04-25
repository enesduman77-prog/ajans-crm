package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.MaintenanceLogRequest;
import com.fogistanbul.crm.dto.MaintenanceLogResponse;
import com.fogistanbul.crm.service.MaintenanceLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/companies/{companyId}/maintenance-log")
@RequiredArgsConstructor
public class MaintenanceLogController {

    private final MaintenanceLogService service;

    @GetMapping
    public List<MaintenanceLogResponse> list(@PathVariable UUID companyId, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().iterator().next().getAuthority();
        return service.listForCompany(companyId, userId, role);
    }

    @PostMapping
    public ResponseEntity<MaintenanceLogResponse> create(
            @PathVariable UUID companyId,
            @Valid @RequestBody MaintenanceLogRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(companyId, request, userId));
    }

    @PutMapping("/{id}")
    public MaintenanceLogResponse update(
            @PathVariable UUID companyId,
            @PathVariable UUID id,
            @Valid @RequestBody MaintenanceLogRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID companyId, @PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
