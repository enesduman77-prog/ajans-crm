package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TaskNoteResponse {
    private UUID id;
    private UUID taskId;
    private UUID authorId;
    private String authorName;
    private String content;
    private Instant createdAt;
}
