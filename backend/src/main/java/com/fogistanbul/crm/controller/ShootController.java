package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.CreateShootRequest;
import com.fogistanbul.crm.dto.ShootResponse;
import com.fogistanbul.crm.service.ShootService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/staff/shoots")
@RequiredArgsConstructor
public class ShootController {

    private final ShootService shootService;

    @PostMapping
    public ResponseEntity<ShootResponse> create(
            @Valid @RequestBody CreateShootRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shootService.createShoot(request, userId));
    }

    @GetMapping
    public Page<ShootResponse> getAll(@PageableDefault(size = 20) Pageable pageable, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return shootService.getAllShoots(pageable, userId);
    }

    @GetMapping("/company/{companyId}")
    public Page<ShootResponse> getByCompany(
            @PathVariable UUID companyId,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return shootService.getShootsByCompany(companyId, pageable, userId);
    }

    @GetMapping("/{id}")
    public ShootResponse getById(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return shootService.getShootById(id, userId);
    }

    @PutMapping("/{id}/status")
    public ShootResponse updateStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().iterator().next().getAuthority();
        return shootService.updateStatus(id, status, userId, role);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().iterator().next().getAuthority();
        shootService.deleteShoot(id, userId, role);
        return ResponseEntity.noContent().build();
    }
}
