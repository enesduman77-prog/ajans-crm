package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.ContactResponse;
import com.fogistanbul.crm.dto.CreateTaskNoteRequest;
import com.fogistanbul.crm.dto.CreateTaskRequest;
import com.fogistanbul.crm.dto.TaskNoteResponse;
import com.fogistanbul.crm.dto.TaskResponse;
import com.fogistanbul.crm.dto.UpdateTaskRequest;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import com.fogistanbul.crm.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @Valid @RequestBody CreateTaskRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.createTask(request, userId));
    }

    @GetMapping
    public Page<TaskResponse> getAll(
            @RequestParam(required = false) TaskStatus status,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        if (status != null) {
            return taskService.getTasksByStatus(status, pageable, userId);
        }
        return taskService.getAllTasks(pageable, userId);
    }

    @GetMapping("/my")
    public Page<TaskResponse> getMyTasks(
            Authentication auth,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = (UUID) auth.getPrincipal();
        return taskService.getTasksByAssignee(userId, pageable);
    }

    @GetMapping("/company/{companyId}")
    public Page<TaskResponse> getByCompany(
            @PathVariable UUID companyId,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return taskService.getTasksByCompany(companyId, pageable, userId);
    }

    @GetMapping("/{id}")
    public TaskResponse getById(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return taskService.getTaskById(id, userId);
    }

    @PutMapping("/{id}")
    public TaskResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return taskService.updateTask(id, request, userId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        taskService.deleteTask(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assignable-users")
    public List<ContactResponse> getAssignableUsers(
            @RequestParam(required = false) UUID companyId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return taskService.getAssignableUsers(userId, companyId);
    }

    // ─── Task Notes ─────────────────────────────────────────────

    @GetMapping("/{taskId}/notes")
    public List<TaskNoteResponse> getNotes(@PathVariable UUID taskId, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return taskService.getTaskNotes(taskId, userId);
    }

    @PostMapping("/{taskId}/notes")
    public ResponseEntity<TaskNoteResponse> addNote(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateTaskNoteRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.addTaskNote(taskId, request, userId));
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(@PathVariable UUID noteId, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        taskService.deleteTaskNote(noteId, userId);
        return ResponseEntity.noContent().build();
    }
}
