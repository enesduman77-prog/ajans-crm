package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class CreateMeetingRequest {
    private UUID companyId;

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private Instant meetingDate;

    private Integer durationMinutes;

    private String location;

    private List<UUID> participantIds;
}
