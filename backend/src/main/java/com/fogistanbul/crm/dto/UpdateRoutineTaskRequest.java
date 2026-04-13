package com.fogistanbul.crm.dto;

import com.fogistanbul.crm.entity.enums.Priority;
import com.fogistanbul.crm.entity.enums.RoutineFrequency;
import com.fogistanbul.crm.entity.enums.TaskCategory;
import lombok.Data;

import java.time.LocalTime;
import java.util.UUID;

@Data
public class UpdateRoutineTaskRequest {
    private String title;
    private String description;
    private RoutineFrequency frequency;
    private Integer dayOfWeek;
    private Integer dayOfMonth;
    private LocalTime executionTime;
    private UUID assignedToId;
    private TaskCategory category;
    private Priority priority;
    private Boolean isActive;
}
