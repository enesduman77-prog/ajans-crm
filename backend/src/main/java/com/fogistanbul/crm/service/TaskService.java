package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.ContactResponse;
import com.fogistanbul.crm.dto.CreateTaskNoteRequest;
import com.fogistanbul.crm.dto.CreateTaskRequest;
import com.fogistanbul.crm.dto.TaskNoteResponse;
import com.fogistanbul.crm.dto.TaskResponse;
import com.fogistanbul.crm.dto.UpdateTaskRequest;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.entity.TaskNote;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.Priority;
import com.fogistanbul.crm.entity.enums.TaskCategory;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.TaskNoteRepository;
import com.fogistanbul.crm.repository.TaskRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskNoteRepository taskNoteRepository;
    private final CompanyRepository companyRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional
    public TaskResponse createTask(CreateTaskRequest req, UUID createdById) {
        UserProfile creator = getUserOrThrow(createdById);
        UserProfile assignee = getUserOrThrow(req.getAssignedToId());

        Company company = null;
        if (req.getCompanyId() != null) {
            company = companyRepository.findById(req.getCompanyId())
                    .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
            ensureCompanyAccess(creator, company.getId());
        }

        // Permission check: company users can only assign to agency staff connected to them
        if (creator.getGlobalRole() == GlobalRole.COMPANY_USER) {
            if (assignee.getGlobalRole() != GlobalRole.AGENCY_STAFF && !assignee.getId().equals(createdById)) {
                throw new RuntimeException("Sadece ajans çalışanlarına görev atayabilirsiniz");
            }
            if (assignee.getGlobalRole() == GlobalRole.AGENCY_STAFF && company != null) {
                ensureCompanyAccess(assignee, company.getId());
            }
        }

        Task task = Task.builder()
                .company(company)
                .createdBy(creator)
                .assignedTo(assignee)
                .title(req.getTitle())
                .description(req.getDescription())
                .category(req.getCategory() != null ? req.getCategory() : TaskCategory.OTHER)
                .priority(req.getPriority() != null ? req.getPriority() : Priority.MEDIUM)
                .startDate(req.getStartDate())
                .startTime(req.getStartTime())
                .endDate(req.getEndDate())
                .endTime(req.getEndTime())
                .build();

        task = taskRepository.save(task);
        log.info("Task created: {} assigned to {}", task.getTitle(), assignee.getEmail());
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
        // Non-admin users only see tasks assigned to them
        return taskRepository.findByAssignedToId(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByStatus(TaskStatus status, Pageable pageable, UUID userId) {
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return taskRepository.findByStatus(status, pageable).map(this::toResponse);
        }
        // Non-admin users only see their own tasks with given status
        return taskRepository.findByAssignedToIdAndStatus(userId, status, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByAssigneeAndStatus(UUID userId, TaskStatus status, Pageable pageable) {
        return taskRepository.findByAssignedToIdAndStatus(userId, status, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() != GlobalRole.ADMIN
                && !task.getAssignedTo().getId().equals(userId)
                && !task.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Bu gorevi goruntuleme yetkiniz yok");
        }
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
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() != GlobalRole.ADMIN
                && !task.getAssignedTo().getId().equals(userId)
                && !task.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Bu gorevi guncelleme yetkiniz yok");
        }

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
        if (req.getAssignedToId() != null) {
            UserProfile assignee = getUserOrThrow(req.getAssignedToId());
            task.setAssignedTo(assignee);
        }
        if (req.getCompanyId() != null) {
            Company company = companyRepository.findById(req.getCompanyId())
                    .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
            task.setCompany(company);
        }
        if (req.getStartDate() != null) {
            task.setStartDate(req.getStartDate());
        }
        if (req.getStartTime() != null) {
            task.setStartTime(req.getStartTime());
        }
        if (req.getEndDate() != null) {
            task.setEndDate(req.getEndDate());
        }
        if (req.getEndTime() != null) {
            task.setEndTime(req.getEndTime());
        }

        task = taskRepository.save(task);
        log.info("Task updated: {}", task.getTitle());
        return toResponse(task);
    }

    @Transactional
    public void deleteTask(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() != GlobalRole.ADMIN && !task.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Bu gorevi silme yetkiniz yok");
        }
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

    @Transactional(readOnly = true)
    public List<ContactResponse> getAssignableUsers(UUID userId, UUID companyId) {
        UserProfile user = getUserOrThrow(userId);

        List<UserProfile> users;
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            users = userProfileRepository.findAll();
        } else if (user.getGlobalRole() == GlobalRole.AGENCY_STAFF) {
            // Agency staff can assign to other agency staff + users in their companies
            var companyIds = membershipRepository.findCompanyIdsByUserId(userId);
            var memberIds = membershipRepository.findDistinctUserIdsByCompanyIds(companyIds);
            users = userProfileRepository.findAllById(memberIds);
            // Also include all agency staff
            var allAgencyStaff = userProfileRepository.findByGlobalRole(GlobalRole.AGENCY_STAFF);
            for (var s : allAgencyStaff) {
                if (users.stream().noneMatch(u -> u.getId().equals(s.getId()))) {
                    users.add(s);
                }
            }
        } else {
            // Company user: only agency staff connected to their companies
            var companyIds = membershipRepository.findCompanyIdsByUserId(userId);
            var memberIds = membershipRepository.findAgencyStaffUserIdsByCompanyIds(companyIds);
            users = userProfileRepository.findAllById(memberIds);
        }

        if (companyId != null) {
            var companyMemberIds = membershipRepository.findByCompanyId(companyId)
                    .stream().map(m -> m.getUser().getId()).collect(Collectors.toSet());
            users = users.stream()
                    .filter(u -> companyMemberIds.contains(u.getId()) || u.getGlobalRole() == GlobalRole.ADMIN)
                    .collect(Collectors.toList());
        }

        return users.stream()
                .map(u -> ContactResponse.builder()
                        .id(u.getId().toString())
                        .fullName(u.getPerson() != null ? u.getPerson().getFullName() : u.getEmail())
                        .email(u.getEmail())
                        .globalRole(u.getGlobalRole().name())
                        .avatarUrl(u.getPerson() != null ? u.getPerson().getAvatarUrl() : null)
                        .build())
                .collect(Collectors.toList());
    }

    private UserProfile getUserOrThrow(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));
    }

    private TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .companyId(task.getCompany() != null ? task.getCompany().getId() : null)
                .companyName(task.getCompany() != null ? task.getCompany().getName() : null)
                .assignedToId(task.getAssignedTo().getId())
                .assignedToName(task.getAssignedTo().getPerson() != null
                        ? task.getAssignedTo().getPerson().getFullName()
                        : task.getAssignedTo().getEmail())
                .createdById(task.getCreatedBy().getId())
                .createdByName(task.getCreatedBy().getPerson() != null
                        ? task.getCreatedBy().getPerson().getFullName()
                        : task.getCreatedBy().getEmail())
                .title(task.getTitle())
                .description(task.getDescription())
                .category(task.getCategory())
                .priority(task.getPriority())
                .status(task.getStatus())
                .startDate(task.getStartDate())
                .startTime(task.getStartTime())
                .endDate(task.getEndDate())
                .endTime(task.getEndTime())
                .completedAt(task.getCompletedAt())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    // ─── Task Notes ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TaskNoteResponse> getTaskNotes(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));
        return taskNoteRepository.findByTaskIdOrderByCreatedAtDesc(taskId)
                .stream().map(this::toNoteResponse).collect(Collectors.toList());
    }

    @Transactional
    public TaskNoteResponse addTaskNote(UUID taskId, CreateTaskNoteRequest req, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));
        UserProfile author = getUserOrThrow(userId);
        TaskNote note = TaskNote.builder()
                .task(task)
                .author(author)
                .content(req.getContent())
                .build();
        return toNoteResponse(taskNoteRepository.save(note));
    }

    @Transactional
    public void deleteTaskNote(UUID noteId, UUID userId) {
        TaskNote note = taskNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Not bulunamadi"));
        UserProfile user = getUserOrThrow(userId);
        if (!note.getAuthor().getId().equals(userId) && user.getGlobalRole() != GlobalRole.ADMIN) {
            throw new RuntimeException("Bu notu silme yetkiniz yok");
        }
        taskNoteRepository.delete(note);
    }

    private TaskNoteResponse toNoteResponse(TaskNote note) {
        return TaskNoteResponse.builder()
                .id(note.getId())
                .taskId(note.getTask().getId())
                .authorId(note.getAuthor().getId())
                .authorName(note.getAuthor().getPerson() != null
                        ? note.getAuthor().getPerson().getFullName()
                        : note.getAuthor().getEmail())
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .build();
    }

    // ─── Scheduled: mark overdue tasks ──────────────────────

    @Scheduled(fixedRate = 60000) // every minute
    @Transactional
    public void markOverdueTasks() {
        int count = taskRepository.markOverdueTasks(Instant.now());
        if (count > 0) {
            log.info("Marked {} tasks as OVERDUE", count);
        }
    }
}
