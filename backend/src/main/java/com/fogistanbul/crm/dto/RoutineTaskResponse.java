package com.fogistanbul.crm.dto;

import com.fogistanbul.crm.entity.enums.Priority;
import com.fogistanbul.crm.entity.enums.RoutineFrequency;
import com.fogistanbul.crm.entity.enums.TaskCategory;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
public class RoutineTaskResponse {
    private UUID id;
    private String title;
    private String description;
    private RoutineFrequency frequency;
    private Integer dayOfWeek;
    private Integer dayOfMonth;
    private LocalTime executionTime;
    private UUID assignedToId;
    private String assignedToName;
    private TaskCategory category;
    private Priority priority;
    private Boolean isActive;
    private UUID createdById;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
    // for staff view: is current period completed?
    private Boolean completedThisPeriod;
}
