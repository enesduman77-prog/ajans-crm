package com.fogistanbul.crm.dto;

import com.fogistanbul.crm.entity.enums.Priority;
import com.fogistanbul.crm.entity.enums.TaskCategory;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
public class TaskResponse {
    private UUID id;
    private UUID companyId;
    private String companyName;
    private UUID assignedToId;
    private String assignedToName;
    private UUID createdById;
    private String createdByName;
    private String title;
    private String description;
    private TaskCategory category;
    private Priority priority;
    private TaskStatus status;
    private Instant dueDate;
    private LocalTime dueTime;
    private Instant completedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
