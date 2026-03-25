package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TimeEntryResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private UUID taskId;
    private String taskTitle;
    private UUID companyId;
    private String companyName;
    private String description;
    private Instant startedAt;
    private Instant endedAt;
    private Integer durationMinutes;
    private boolean isRunning;
    private Instant createdAt;
}
