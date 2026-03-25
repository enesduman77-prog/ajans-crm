package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStats {
    private long totalCompanies;
    private long activeCompanies;
    private long totalStaff;
    private long totalTasks;
    private long todoTasks;
    private long inProgressTasks;
    private long doneTasks;
}
