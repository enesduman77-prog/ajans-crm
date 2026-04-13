package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.*;
import com.fogistanbul.crm.service.RoutineTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/routines")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminRoutineController {

    private final RoutineTaskService routineTaskService;

    @PostMapping
    public ResponseEntity<RoutineTaskResponse> create(
            @Valid @RequestBody CreateRoutineTaskRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(routineTaskService.createRoutine(request, userId));
    }

    @GetMapping
    public Page<RoutineTaskResponse> getAll(@PageableDefault(size = 50) Pageable pageable) {
        return routineTaskService.getAllRoutines(pageable);
    }

    @GetMapping("/{id}")
    public RoutineTaskResponse getById(@PathVariable UUID id) {
        return routineTaskService.getRoutineById(id);
    }

    @PutMapping("/{id}")
    public RoutineTaskResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoutineTaskRequest request) {
        return routineTaskService.updateRoutine(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        routineTaskService.deleteRoutine(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate")
    public ResponseEntity<Void> triggerGeneration() {
        routineTaskService.generateTasksFromRoutines();
        return ResponseEntity.ok().build();
    }
}
