package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class MaintenanceLogResponse {
    private String id;
    private String companyId;
    private String title;
    private String description;
    private String category;
    private Instant performedAt;
    private String performedById;
    private String performedByName;
    private Instant createdAt;
    private Instant updatedAt;
}
