package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.CreateTaskRequest;
import com.fogistanbul.crm.dto.TaskResponse;
import com.fogistanbul.crm.dto.UpdateTaskRequest;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.Priority;
import com.fogistanbul.crm.entity.enums.TaskCategory;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.TaskRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final CompanyRepository companyRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional
    public TaskResponse createTask(CreateTaskRequest req, UUID createdById) {
        Company company = companyRepository.findById(req.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));

        UserProfile creator = getUserOrThrow(createdById);
        ensureCompanyAccess(creator, company.getId());

        Task task = Task.builder()
                .company(company)
                .createdBy(creator)
                .title(req.getTitle())
                .description(req.getDescription())
                .category(req.getCategory() != null ? req.getCategory() : TaskCategory.OTHER)
                .priority(req.getPriority() != null ? req.getPriority() : Priority.MEDIUM)
                .dueDate(req.getDueDate())
                .dueTime(req.getDueTime())
                .build();

        if (req.getAssignedToId() != null) {
            UserProfile assignee = getUserOrThrow(req.getAssignedToId());
            ensureCompanyAccess(assignee, company.getId());
            task.setAssignedTo(assignee);
        }

        task = taskRepository.save(task);
        log.info("Task created: {} for company {}", task.getTitle(), company.getName());
        return toResponse(task);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByCompany(UUID companyId, Pageable pageable, UUID userId) {
        ensureCompanyAccess(getUserOrThrow(userId), companyId);
        return taskRepository.findByCompanyId(companyId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByAssignee(UUID userId, Pageable pageable) {
        return taskRepository.findByAssignedToId(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getAllTasks(Pageable pageable, UUID userId) {
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return taskRepository.findAll(pageable).map(this::toResponse);
        }

        var companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        if (companyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return taskRepository.findByCompanyIdIn(companyIds, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByStatus(TaskStatus status, Pageable pageable, UUID userId) {
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return taskRepository.findByStatus(status, pageable).map(this::toResponse);
        }

        var companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        if (companyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return taskRepository.findByCompanyIdInAndStatus(companyIds, status, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByAssigneeAndStatus(UUID userId, TaskStatus status, Pageable pageable) {
        return taskRepository.findByAssignedToIdAndStatus(userId, status, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), task.getCompany().getId());
        return toResponse(task);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskByIdForUser(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));
        boolean isAssignee = task.getAssignedTo() != null && task.getAssignedTo().getId().equals(userId);
        boolean isCreator = task.getCreatedBy() != null && task.getCreatedBy().getId().equals(userId);
        if (!isAssignee && !isCreator) {
            throw new RuntimeException("Bu gorevi goruntuleme yetkiniz yok");
        }
        return toResponse(task);
    }

    @Transactional
    public TaskResponse updateTask(UUID taskId, UpdateTaskRequest req, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), task.getCompany().getId());

        if (req.getTitle() != null) {
            task.setTitle(req.getTitle());
        }
        if (req.getDescription() != null) {
            task.setDescription(req.getDescription());
        }
        if (req.getStatus() != null) {
            task.setStatus(req.getStatus());
            if (req.getStatus() == TaskStatus.DONE) {
                task.setCompletedAt(Instant.now());
            } else {
                task.setCompletedAt(null);
            }
        }
        if (req.getCategory() != null) {
            task.setCategory(TaskCategory.valueOf(req.getCategory()));
        }
        if (req.getPriority() != null) {
            task.setPriority(Priority.valueOf(req.getPriority()));
        }

        task = taskRepository.save(task);
        log.info("Task updated: {}", task.getTitle());
        return toResponse(task);
    }

    @Transactional
    public void deleteTask(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), task.getCompany().getId());
        taskRepository.delete(task);
    }

    private void ensureCompanyAccess(UserProfile user, UUID companyId) {
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return;
        }
        if (!membershipRepository.existsByUserIdAndCompanyId(user.getId(), companyId)) {
            throw new RuntimeException("Bu sirket verilerine erisim yetkiniz yok");
        }
    }

    private UserProfile getUserOrThrow(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));
    }

    private TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .companyId(task.getCompany().getId())
                .companyName(task.getCompany().getName())
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToName(task.getAssignedTo() != null && task.getAssignedTo().getPerson() != null
                        ? task.getAssignedTo().getPerson().getFullName()
                        : null)
                .createdById(task.getCreatedBy().getId())
                .createdByName(task.getCreatedBy().getPerson() != null
                        ? task.getCreatedBy().getPerson().getFullName()
                        : task.getCreatedBy().getEmail())
                .title(task.getTitle())
                .description(task.getDescription())
                .category(task.getCategory())
                .priority(task.getPriority())
                .status(task.getStatus())
                .dueDate(task.getDueDate())
                .dueTime(task.getDueTime())
                .completedAt(task.getCompletedAt())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
