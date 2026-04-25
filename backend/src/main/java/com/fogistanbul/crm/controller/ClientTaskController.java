package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.TaskResponse;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.service.TaskService;
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
@RequestMapping("/api/client/tasks")
@RequiredArgsConstructor
public class ClientTaskController {

    private final TaskService taskService;
    private final CompanyMembershipRepository membershipRepository;

    @GetMapping("/my")
    public ResponseEntity<Page<TaskResponse>> getMyTasks(
            Authentication auth,
            @RequestParam(required = false) TaskStatus status,
            @PageableDefault(size = 50) Pageable pageable) {

        UUID userId = (UUID) auth.getPrincipal();
        List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);

        if (companyIds.isEmpty()) {
            return ResponseEntity.ok(Page.empty(pageable));
        }

        UUID companyId = companyIds.get(0);
        Page<TaskResponse> result = status != null
                ? taskService.getTasksByCompanyAndStatus(companyId, status, pageable, userId)
                : taskService.getTasksByCompany(companyId, pageable, userId);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public TaskResponse getById(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return taskService.getTaskByIdForUser(id, userId);
    }
}
