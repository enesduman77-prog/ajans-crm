package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FileAttachmentResponse {
    private UUID id;
    private String originalName;
    private String contentType;
    private Long fileSize;
    private UUID uploadedById;
    private String uploadedByName;
    private String entityType;
    private UUID entityId;
    private Instant createdAt;
}
