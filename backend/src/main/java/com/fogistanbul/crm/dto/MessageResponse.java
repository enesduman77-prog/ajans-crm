package com.fogistanbul.crm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class MessageResponse {
    private String id;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String senderAvatarUrl;
    private String content;

    @JsonProperty("isRead")
    private boolean isRead;

    @JsonProperty("approvalPending")
    private boolean approvalPending;

    private Instant createdAt;
}
