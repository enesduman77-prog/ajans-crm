package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StaffAnalyticsResponse {

    // Summary stats
    private long activeTasks;
    private long completedThisWeek;
    private long pendingTasks;
    private int completionRate; // percentage
    private int totalMinutesThisMonth;
    private long overdueTasks;

    // Weekly task flow (last 7 days)
    private List<DailyTaskStat> weeklyFlow;

    // Monthly working hours (last 6 months)
    private List<MonthlyHours> monthlyHours;

    // Tasks per company
    private List<CompanyTaskStat> companyTasks;

    @Data @Builder
    public static class DailyTaskStat {
        private String name; // day label
        private long tamamlanan;
        private long yeni;
    }

    @Data @Builder
    public static class PriorityStat {
        private String name;
        private long value;
        private String color;
    }

    @Data @Builder
    public static class MonthlyHours {
        private String name;
        private int saat;
    }

    @Data @Builder
    public static class CompanyTaskStat {
        private String label;
        private long value;  // completed
        private long max;    // total
        private String color;
    }
}
