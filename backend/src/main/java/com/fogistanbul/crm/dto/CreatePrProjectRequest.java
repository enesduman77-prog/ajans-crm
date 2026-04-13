package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreatePrProjectRequest {
    private UUID companyId;

    @NotBlank
    private String name;

    private String purpose;
    private UUID responsibleId;
    private String startDate;
    private String endDate;
    private String notes;
    private Integer totalPhases;
    private List<PhaseRequest> phases;
    private List<UUID> memberIds;

    @Data
    public static class PhaseRequest {
        private String name;
        private UUID assignedToId;
        private String startDate;
        private String endDate;
        private String notes;
    }
}
