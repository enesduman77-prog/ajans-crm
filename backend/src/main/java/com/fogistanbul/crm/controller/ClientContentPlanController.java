package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.ContentPlanResponse;
import com.fogistanbul.crm.dto.ApproveContentPlanRequest;
import com.fogistanbul.crm.service.ContentPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/client/content-plans")
@RequiredArgsConstructor
public class ClientContentPlanController {

    private final ContentPlanService contentPlanService;

    @GetMapping
    public ResponseEntity<Page<ContentPlanResponse>> getByCompany(
            @RequestParam UUID companyId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(contentPlanService.getByCompany(companyId, status, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContentPlanResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(contentPlanService.getById(id));
    }

    @GetMapping("/shoot/{shootId}")
    public ResponseEntity<List<ContentPlanResponse>> getByShoot(@PathVariable UUID shootId) {
        return ResponseEntity.ok(contentPlanService.getByShoot(shootId));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ContentPlanResponse> approveWithShoot(
            @PathVariable UUID id,
            @RequestBody ApproveContentPlanRequest req,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(contentPlanService.approveWithShoot(
            id, userId, req.getCompanyId(), req.getShootTitle(),
            req.getShootDescription(), req.getShootDate(), req.getShootTime(), req.getLocation()
        ));
    }

    @PostMapping("/{id}/approve-existing")
    public ResponseEntity<ContentPlanResponse> approveWithExistingShoot(
            @PathVariable UUID id,
            @RequestParam UUID companyId,
            @RequestParam UUID shootId) {
        return ResponseEntity.ok(contentPlanService.approveWithExistingShoot(id, companyId, shootId));
    }
}
