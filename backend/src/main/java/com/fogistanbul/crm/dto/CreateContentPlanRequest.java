package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateContentPlanRequest {
    @NotNull
    private UUID companyId;

    @NotBlank
    private String title;

    private String description;

    @NotBlank
    private String authorName;

    @NotBlank
    private String platform;

    private String contentSize;
    private String direction;
    private String speakerModel;
    private String plannedDate;
}
