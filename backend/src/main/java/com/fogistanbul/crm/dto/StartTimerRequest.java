package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class StartTimerRequest {
    @NotNull
    private UUID taskId;
    private String description;
}
