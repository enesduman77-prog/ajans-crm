package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TaskReviewResponse {
    private UUID id;
    private UUID taskId;
    private String taskTitle;
    private UUID reviewerId;
    private String reviewerName;
    private Integer score;
    private String comment;
    private Instant createdAt;
}
