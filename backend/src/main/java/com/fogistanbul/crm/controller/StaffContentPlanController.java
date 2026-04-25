package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.ContentPlanResponse;
import com.fogistanbul.crm.dto.CreateContentPlanRequest;
import com.fogistanbul.crm.dto.UpdateContentPlanRequest;
import com.fogistanbul.crm.service.ContentPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/content-plans")
@RequiredArgsConstructor
public class StaffContentPlanController {

    private final ContentPlanService contentPlanService;

    @PostMapping
    public ResponseEntity<ContentPlanResponse> create(
            @RequestBody CreateContentPlanRequest req,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(contentPlanService.create(req, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContentPlanResponse> update(
            @PathVariable UUID id,
            @RequestBody UpdateContentPlanRequest req) {
        return ResponseEntity.ok(contentPlanService.update(id, req));
    }

    @GetMapping
    public ResponseEntity<Page<ContentPlanResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(contentPlanService.getAll(page, size));
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<Page<ContentPlanResponse>> getByCompany(
            @PathVariable UUID companyId,
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        contentPlanService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
