package com.fogistanbul.crm.dto;

import com.fogistanbul.crm.entity.enums.Priority;
import com.fogistanbul.crm.entity.enums.RoutineFrequency;
import com.fogistanbul.crm.entity.enums.TaskCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateRoutineTaskRequest {
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private RoutineFrequency frequency;
    private Integer dayOfWeek;
    private Integer dayOfMonth;
    private LocalTime executionTime;
    private UUID assignedToId;
    private TaskCategory category;
    private Priority priority;
}
