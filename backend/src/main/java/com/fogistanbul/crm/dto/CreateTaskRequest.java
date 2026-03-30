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
    private UUID companyId;

    @NotNull(message = "Atanan kişi zorunludur")
    private UUID assignedToId;

    @NotBlank(message = "Görev başlığı zorunludur")
    private String title;

    private String description;

    private TaskCategory category;

    private Priority priority;

    private Instant startDate;

    private LocalTime startTime;

    private Instant endDate;

    private LocalTime endTime;
}
