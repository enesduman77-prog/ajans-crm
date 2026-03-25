package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.CompanyResponse;
import com.fogistanbul.crm.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/companies")
@PreAuthorize("hasAnyRole('ADMIN', 'AGENCY_STAFF')")
@RequiredArgsConstructor
public class StaffPortalController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<List<CompanyResponse>> getAllClients(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("AGENCY_STAFF");
        return ResponseEntity.ok(companyService.getAllClientsForUser(userId, role));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponse> getById(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("AGENCY_STAFF");
        return ResponseEntity.ok(companyService.getByIdForUser(id, userId, role));
    }
}
