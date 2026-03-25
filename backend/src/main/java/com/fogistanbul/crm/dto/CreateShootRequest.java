package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
public class CreateShootRequest {
    @NotNull
    private UUID companyId;

    @NotBlank
    private String title;

    private String description;
    private Instant shootDate;
    private LocalTime shootTime;
    private String location;
    private List<ShootParticipantRequest> participants;

    @Data
    public static class ShootParticipantRequest {
        private UUID userId;
        private String roleInShoot;
    }
}
