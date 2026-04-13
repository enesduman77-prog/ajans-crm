package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.*;
import com.fogistanbul.crm.entity.*;
import com.fogistanbul.crm.entity.enums.*;
import com.fogistanbul.crm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.IsoFields;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoutineTaskService {

    private final RoutineTaskRepository routineTaskRepository;
    private final TaskRepository taskRepository;
    private final UserProfileRepository userProfileRepository;

    // ─── Admin operations ───

    @Transactional
    public RoutineTaskResponse createRoutine(CreateRoutineTaskRequest req, UUID createdById) {
        UserProfile creator = getUserOrThrow(createdById);

        UserProfile assignee = null;
        if (req.getAssignedToId() != null) {
            assignee = getUserOrThrow(req.getAssignedToId());
        }

        RoutineTask routine = RoutineTask.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .frequency(req.getFrequency())
                .dayOfWeek(req.getDayOfWeek())
                .dayOfMonth(req.getDayOfMonth())
                .executionTime(req.getExecutionTime())
                .assignedTo(assignee)
                .category(req.getCategory() != null ? req.getCategory() : TaskCategory.OTHER)
                .createdBy(creator)
                .build();

        routine = routineTaskRepository.save(routine);
        log.info("Routine created: {} by {}", routine.getTitle(), creator.getEmail());

        // Hemen bugünün görevini oluştur
        generateTasksForRoutine(routine);

        return toResponse(routine);
    }

    @Transactional
    public RoutineTaskResponse updateRoutine(UUID routineId, UpdateRoutineTaskRequest req) {
        RoutineTask routine = routineTaskRepository.findById(routineId)
                .orElseThrow(() -> new RuntimeException("Rutin bulunamadi"));

        if (req.getTitle() != null) routine.setTitle(req.getTitle());
        if (req.getDescription() != null) routine.setDescription(req.getDescription());
        if (req.getFrequency() != null) routine.setFrequency(req.getFrequency());
        if (req.getDayOfWeek() != null) routine.setDayOfWeek(req.getDayOfWeek());
        if (req.getDayOfMonth() != null) routine.setDayOfMonth(req.getDayOfMonth());
        if (req.getExecutionTime() != null) routine.setExecutionTime(req.getExecutionTime());
        if (req.getCategory() != null) routine.setCategory(req.getCategory());
        if (req.getIsActive() != null) routine.setIsActive(req.getIsActive());
        if (req.getAssignedToId() != null) {
            routine.setAssignedTo(getUserOrThrow(req.getAssignedToId()));
        }

        routine = routineTaskRepository.save(routine);
        return toResponse(routine);
    }

    @Transactional
    public void deleteRoutine(UUID routineId) {
        routineTaskRepository.deleteById(routineId);
    }

    @Transactional(readOnly = true)
    public Page<RoutineTaskResponse> getAllRoutines(Pageable pageable) {
        return routineTaskRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public RoutineTaskResponse getRoutineById(UUID routineId) {
        RoutineTask routine = routineTaskRepository.findById(routineId)
                .orElseThrow(() -> new RuntimeException("Rutin bulunamadi"));
        return toResponse(routine);
    }

    // ─── Scheduled task generation ───

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 0 0 * * *") // Her gün gece yarısı
    @Transactional
    public void generateTasksFromRoutines() {
        log.info("Rutin görev üretimi başlıyor...");
        LocalDate today = LocalDate.now();

        List<RoutineTask> activeRoutines = routineTaskRepository.findByIsActiveTrue();
        int created = 0;

        for (RoutineTask routine : activeRoutines) {
            if (!isApplicableToday(routine, today)) {
                continue;
            }

            String periodKey = getPeriodKey(routine.getFrequency(), today);

            if (routine.getAssignedTo() != null) {
                // Specific user
                created += createTaskIfNotExists(routine, routine.getAssignedTo(), periodKey, today);
            } else {
                // All agency staff
                List<UserProfile> staffUsers = userProfileRepository.findByGlobalRole(GlobalRole.AGENCY_STAFF);
                for (UserProfile user : staffUsers) {
                    created += createTaskIfNotExists(routine, user, periodKey, today);
                }
            }
        }

        log.info("Rutin görev üretimi tamamlandı. {} yeni görev oluşturuldu.", created);
    }

    private void generateTasksForRoutine(RoutineTask routine) {
        LocalDate today = LocalDate.now();
        if (!isApplicableToday(routine, today)) return;

        String periodKey = getPeriodKey(routine.getFrequency(), today);

        if (routine.getAssignedTo() != null) {
            createTaskIfNotExists(routine, routine.getAssignedTo(), periodKey, today);
        } else {
            List<UserProfile> staffUsers = userProfileRepository.findByGlobalRole(GlobalRole.AGENCY_STAFF);
            for (UserProfile user : staffUsers) {
                createTaskIfNotExists(routine, user, periodKey, today);
            }
        }
    }

    private int createTaskIfNotExists(RoutineTask routine, UserProfile assignee, String periodKey, LocalDate today) {
        if (taskRepository.existsByRoutineIdAndRoutinePeriodKeyAndAssignedToId(
                routine.getId(), periodKey, assignee.getId())) {
            return 0;
        }

        Instant startOfDay = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfDay = today.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        Task task = Task.builder()
                .title(routine.getTitle())
                .description(routine.getDescription())
                .category(routine.getCategory())
                .status(TaskStatus.TODO)
                .assignedTo(assignee)
                .createdBy(routine.getCreatedBy())
                .startDate(startOfDay)
                .endDate(endOfDay)
                .routine(routine)
                .routinePeriodKey(periodKey)
                .build();

        if (routine.getExecutionTime() != null) {
            task.setStartTime(routine.getExecutionTime());
        }

        taskRepository.save(task);
        log.debug("Rutin görev oluşturuldu: {} -> {} ({})", routine.getTitle(), assignee.getEmail(), periodKey);
        return 1;
    }

    // ─── Helpers ───

    private boolean isApplicableToday(RoutineTask routine, LocalDate today) {
        switch (routine.getFrequency()) {
            case DAILY:
                return true;
            case WEEKLY:
                if (routine.getDayOfWeek() == null) return true;
                return today.getDayOfWeek().getValue() == routine.getDayOfWeek();
            case MONTHLY:
                if (routine.getDayOfMonth() == null) return true;
                if (routine.getDayOfMonth() == 0) {
                    return today.equals(today.with(TemporalAdjusters.lastDayOfMonth()));
                }
                return today.getDayOfMonth() == routine.getDayOfMonth();
            default:
                return true;
        }
    }

    private String getPeriodKey(RoutineFrequency frequency, LocalDate date) {
        switch (frequency) {
            case DAILY:
                return date.toString();
            case WEEKLY:
                int week = date.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
                int year = date.get(IsoFields.WEEK_BASED_YEAR);
                return year + "-W" + String.format("%02d", week);
            case MONTHLY:
                return date.getYear() + "-" + String.format("%02d", date.getMonthValue());
            default:
                return date.toString();
        }
    }

    private UserProfile getUserOrThrow(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));
    }

    private RoutineTaskResponse toResponse(RoutineTask r) {
        return RoutineTaskResponse.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .frequency(r.getFrequency())
                .dayOfWeek(r.getDayOfWeek())
                .dayOfMonth(r.getDayOfMonth())
                .executionTime(r.getExecutionTime())
                .assignedToId(r.getAssignedTo() != null ? r.getAssignedTo().getId() : null)
                .assignedToName(r.getAssignedTo() != null
                        ? (r.getAssignedTo().getPerson() != null ? r.getAssignedTo().getPerson().getFullName() : r.getAssignedTo().getEmail())
                        : "Tüm Çalışanlar")
                .category(r.getCategory())
                .isActive(r.getIsActive())
                .createdById(r.getCreatedBy().getId())
                .createdByName(r.getCreatedBy().getPerson() != null
                        ? r.getCreatedBy().getPerson().getFullName()
                        : r.getCreatedBy().getEmail())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .completedThisPeriod(null)
                .build();
    }
}
