package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.MaintenanceLogResponse;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.service.MaintenanceLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/client/maintenance-log")
@RequiredArgsConstructor
public class ClientMaintenanceLogController {

    private final MaintenanceLogService service;
    private final CompanyMembershipRepository membershipRepository;

    @GetMapping
    public List<MaintenanceLogResponse> myCompanyLog(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().iterator().next().getAuthority();
        List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        if (companyIds.isEmpty()) {
            return List.of();
        }
        return service.listForCompany(companyIds.get(0), userId, role);
    }
}
