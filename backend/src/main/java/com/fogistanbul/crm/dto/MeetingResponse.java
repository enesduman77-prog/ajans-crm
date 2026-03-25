package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class MeetingResponse {
    private UUID id;
    private UUID companyId;
    private String companyName;
    private String title;
    private String description;
    private Instant meetingDate;
    private Integer durationMinutes;
    private String location;
    private String status;
    private UUID createdById;
    private String createdByName;
    private List<ParticipantInfo> participants;
    private Instant createdAt;

    @Data
    @Builder
    public static class ParticipantInfo {
        private UUID userId;
        private String fullName;
        private String email;
    }
}
