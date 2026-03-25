package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.CreatePrProjectRequest;
import com.fogistanbul.crm.dto.PrProjectResponse;
import com.fogistanbul.crm.service.PrProjectService;
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
@RequestMapping("/api/staff/pr-projects")
@RequiredArgsConstructor
public class PrProjectController {

    private final PrProjectService prProjectService;

    @PostMapping
    public ResponseEntity<PrProjectResponse> create(
            @Valid @RequestBody CreatePrProjectRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(prProjectService.createProject(request, userId));
    }

    @GetMapping
    public Page<PrProjectResponse> getAll(@PageableDefault(size = 20) Pageable pageable, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return prProjectService.getAllProjects(pageable, userId);
    }

    @GetMapping("/company/{companyId}")
    public Page<PrProjectResponse> getByCompany(
            @PathVariable UUID companyId,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return prProjectService.getProjectsByCompany(companyId, pageable, userId);
    }

    @GetMapping("/{id}")
    public PrProjectResponse getById(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return prProjectService.getProjectById(id, userId);
    }

    @PostMapping("/{projectId}/phases/{phaseId}/complete")
    public PrProjectResponse completePhase(
            @PathVariable UUID projectId,
            @PathVariable UUID phaseId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return prProjectService.completePhase(projectId, phaseId, userId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        prProjectService.deleteProject(id, userId);
        return ResponseEntity.noContent().build();
    }
}
