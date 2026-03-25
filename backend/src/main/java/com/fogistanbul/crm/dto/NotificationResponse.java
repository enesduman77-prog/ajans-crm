package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private String title;
    private String message;
    private String type;
    private String referenceType;
    private UUID referenceId;
    private boolean isRead;
    private Instant createdAt;
}
