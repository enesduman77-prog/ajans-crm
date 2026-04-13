package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.ShootResponse;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.service.ShootService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/client/shoots")
@RequiredArgsConstructor
public class ClientShootController {

    private final ShootService shootService;
    private final CompanyMembershipRepository membershipRepository;

    @GetMapping
    public ResponseEntity<Page<ShootResponse>> getMyCompanyShoots(
            @PageableDefault(size = 20, sort = "shootDate") Pageable pageable,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        if (companyIds.isEmpty()) {
            return ResponseEntity.ok(Page.empty(pageable));
        }
        return ResponseEntity.ok(shootService.getShootsByCompany(companyIds.get(0), pageable, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShootResponse> getShootById(
            @PathVariable UUID id,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(shootService.getShootById(id, userId));
    }
}
