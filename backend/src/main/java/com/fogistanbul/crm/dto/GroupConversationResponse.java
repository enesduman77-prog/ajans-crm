package com.fogistanbul.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupConversationResponse {
    private String id;
    private String name;
    private String companyId;
    private String companyName;
    private String avatarUrl;
    private int memberCount;
    private long unreadCount;
    private Instant updatedAt;
    private Instant createdAt;
    private GroupMessageResponse lastMessage;
    private List<GroupMemberInfo> members;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupMemberInfo {
        private String userId;
        private String fullName;
        private String avatarUrl;
        private String membershipRole;
        private String positionTitle;
    }
}
