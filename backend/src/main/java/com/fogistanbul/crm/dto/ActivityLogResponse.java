package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class ActivityLogResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private String action;
    private String entityType;
    private UUID entityId;
    private String entityName;
    private Map<String, Object> details;
    private Instant createdAt;
}
