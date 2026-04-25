package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ShootResponse {
    private UUID id;
    private UUID companyId;
    private String companyName;
    private String title;
    private String description;
    private Instant shootDate;
    private LocalTime shootTime;
    private String location;
    private String status;
    private UUID photographerId;
    private String photographerName;
    private String notes;
    private UUID createdById;
    private String createdByName;
    private List<ParticipantInfo> participants;
    private List<EquipmentInfo> equipment;
    private int linkedContentCount;
    private Instant createdAt;

    @Data
    @Builder
    public static class ParticipantInfo {
        private UUID userId;
        private String fullName;
        private String roleInShoot;
    }

    @Data
    @Builder
    public static class EquipmentInfo {
        private UUID id;
        private String name;
        private Integer quantity;
        private String notes;
    }
}
