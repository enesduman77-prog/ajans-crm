package com.fogistanbul.crm.dto;

import com.fogistanbul.crm.entity.enums.Priority;
import com.fogistanbul.crm.entity.enums.TaskCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateTaskRequest {
    @NotNull(message = "Şirket zorunludur")
    private UUID companyId;

    private UUID assignedToId;

    @NotBlank(message = "Görev başlığı zorunludur")
    private String title;

    private String description;

    private TaskCategory category;

    private Priority priority;

    private Instant dueDate;

    private LocalTime dueTime;
}
