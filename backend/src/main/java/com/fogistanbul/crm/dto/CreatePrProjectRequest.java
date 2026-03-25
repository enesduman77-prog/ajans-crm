package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreatePrProjectRequest {
    @NotNull
    private UUID companyId;

    @NotBlank
    private String name;

    private String purpose;
    private Integer totalPhases;
    private List<String> phaseNames;
    private List<UUID> memberIds;
}
