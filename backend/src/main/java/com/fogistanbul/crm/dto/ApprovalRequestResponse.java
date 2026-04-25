package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ApprovalRequestResponse {
    private UUID id;
    private String type;
    private UUID referenceId;
    private String companyName;
    private UUID companyId;
    private String requestedByName;
    private UUID requestedById;
    private String status;
    private String title;
    private String description;
    private String metadata;
    private String reviewedByName;
    private String reviewNote;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}
