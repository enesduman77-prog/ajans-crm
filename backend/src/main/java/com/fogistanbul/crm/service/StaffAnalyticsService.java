package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.StaffAnalyticsResponse;
import com.fogistanbul.crm.dto.StaffAnalyticsResponse.*;
import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import com.fogistanbul.crm.repository.TaskRepository;
import com.fogistanbul.crm.repository.TimeEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffAnalyticsService {

    private final TaskRepository taskRepository;
    private final TimeEntryRepository timeEntryRepository;

    private static final String[] COMPANY_COLORS = {
            "#3b82f6", "#f97316", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#eab308"
    };

    @Transactional(readOnly = true)
    public StaffAnalyticsResponse getAnalytics(UUID userId) {
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);

        // ── Summary Stats ──
        long activeTasks = taskRepository.countByAssignedToIdAndStatus(userId, TaskStatus.TODO)
                + taskRepository.countByAssignedToIdAndStatus(userId, TaskStatus.IN_PROGRESS);
        long pendingTasks = taskRepository.countByAssignedToIdAndStatus(userId, TaskStatus.TODO);
        long overdueTasks = taskRepository.countByAssignedToIdAndStatus(userId, TaskStatus.OVERDUE);
        long totalTasks = taskRepository.countByAssignedToId(userId);
        long doneTasks = taskRepository.countByAssignedToIdAndStatus(userId, TaskStatus.DONE);

        // This week's completed tasks
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        Instant weekStartInst = weekStart.atStartOfDay(zone).toInstant();
        Instant weekEndInst = today.plusDays(1).atStartOfDay(zone).toInstant();
        List<Task> completedThisWeekList = taskRepository.findCompletedByUserInRange(userId, weekStartInst, weekEndInst);
        long completedThisWeek = completedThisWeekList.size();

        int completionRate = totalTasks > 0 ? (int) Math.round((doneTasks * 100.0) / totalTasks) : 0;

        // Time tracking this month
        LocalDate monthStart = today.withDayOfMonth(1);
        Instant monthStartInst = monthStart.atStartOfDay(zone).toInstant();
        Instant monthEndInst = today.plusDays(1).atStartOfDay(zone).toInstant();
        int totalMinutesThisMonth = timeEntryRepository.sumDurationByUserAndDateRange(userId, monthStartInst, monthEndInst);

        // ── Weekly Flow (last 7 days) ──
        List<DailyTaskStat> weeklyFlow = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            Instant dayStart = day.atStartOfDay(zone).toInstant();
            Instant dayEnd = day.plusDays(1).atStartOfDay(zone).toInstant();

            long completed = taskRepository.findCompletedByUserInRange(userId, dayStart, dayEnd).size();
            long created = taskRepository.findCreatedForUserInRange(userId, dayStart, dayEnd).size();

            String dayName = day.getDayOfWeek().getDisplayName(TextStyle.SHORT, new Locale("tr"));
            weeklyFlow.add(DailyTaskStat.builder()
                    .name(dayName)
                    .tamamlanan(completed)
                    .yeni(created)
                    .build());
        }

        // ── Monthly Hours (last 6 months) ──
        List<Task> activeTaskList = taskRepository.findByAssignedToIdAndStatusNot(userId, TaskStatus.DONE);
        List<MonthlyHours> monthlyHours = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = today.minusMonths(i).withDayOfMonth(1);
            Instant mStart = m.atStartOfDay(zone).toInstant();
            Instant mEnd = m.with(TemporalAdjusters.lastDayOfMonth()).plusDays(1).atStartOfDay(zone).toInstant();

            int minutes = timeEntryRepository.sumDurationByUserAndDateRange(userId, mStart, mEnd);
            String monthName = m.getMonth().getDisplayName(TextStyle.SHORT, new Locale("tr"));

            monthlyHours.add(MonthlyHours.builder()
                    .name(monthName)
                    .saat(minutes / 60)
                    .build());
        }

        // ── Company Tasks ──
        List<Task> allUserTasks = taskRepository.findByAssignedToIdAndStatusNot(userId, TaskStatus.OVERDUE);
        // Also include DONE tasks for the total
        List<Task> allTasksIncDone = new ArrayList<>(allUserTasks);
        List<Task> doneTasksList = taskRepository.findCompletedByUserInRange(userId,
                Instant.EPOCH, Instant.now().plusSeconds(86400));
        // Use all user tasks (any status)
        Map<String, List<Task>> byCompany = new HashMap<>();
        // Get all tasks for this user
        List<Task> everyTask = new ArrayList<>();
        everyTask.addAll(activeTaskList);
        everyTask.addAll(doneTasksList);

        // Group by company name
        for (Task t : everyTask) {
            String companyName = t.getCompany() != null ? t.getCompany().getName() : "Genel";
            byCompany.computeIfAbsent(companyName, k -> new ArrayList<>()).add(t);
        }

        List<CompanyTaskStat> companyTasks = new ArrayList<>();
        int colorIdx = 0;
        for (Map.Entry<String, List<Task>> entry : byCompany.entrySet()) {
            long total = entry.getValue().size();
            long done = entry.getValue().stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
            companyTasks.add(CompanyTaskStat.builder()
                    .label(entry.getKey())
                    .value(done)
                    .max(total)
                    .color(COMPANY_COLORS[colorIdx % COMPANY_COLORS.length])
                    .build());
            colorIdx++;
        }
        // Sort by total descending
        companyTasks.sort((a, b) -> Long.compare(b.getMax(), a.getMax()));

        return StaffAnalyticsResponse.builder()
                .activeTasks(activeTasks)
                .completedThisWeek(completedThisWeek)
                .pendingTasks(pendingTasks)
                .completionRate(completionRate)
                .totalMinutesThisMonth(totalMinutesThisMonth)
                .overdueTasks(overdueTasks)
                .weeklyFlow(weeklyFlow)
                .monthlyHours(monthlyHours)
                .companyTasks(companyTasks)
                .build();
    }
}
