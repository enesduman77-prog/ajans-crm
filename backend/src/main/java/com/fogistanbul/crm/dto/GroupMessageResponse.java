package com.fogistanbul.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMessageResponse {
    private String id;
    private String groupId;
    private String senderId;
    private String senderName;
    private String senderAvatarUrl;
    private String content;
    private Instant createdAt;
}
