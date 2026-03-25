package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.TaskResponse;
import com.fogistanbul.crm.service.TaskService;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/client/tasks")
@RequiredArgsConstructor
public class ClientTaskController {

    private final TaskService taskService;

    @GetMapping("/my")
    public Page<TaskResponse> getMyTasks(
            Authentication auth,
            @RequestParam(required = false) TaskStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = (UUID) auth.getPrincipal();
        if (status != null) {
            return taskService.getTasksByAssigneeAndStatus(userId, status, pageable);
        }
        return taskService.getTasksByAssignee(userId, pageable);
    }

    @GetMapping("/{id}")
    public TaskResponse getById(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return taskService.getTaskByIdForUser(id, userId);
    }
}
