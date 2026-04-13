package com.fogistanbul.crm.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UpdatePrProjectRequest {
    private String name;
    private String purpose;
    private UUID companyId;
    private UUID responsibleId;
    private String startDate;
    private String endDate;
    private String notes;
    private String status;
    private List<PhaseUpdateRequest> phases;

    @Data
    public static class PhaseUpdateRequest {
        private UUID id;
        private String name;
        private UUID assignedToId;
        private String startDate;
        private String endDate;
        private String notes;
    }
}
