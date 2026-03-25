package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PrProjectResponse {
    private UUID id;
    private UUID companyId;
    private String companyName;
    private String name;
    private String purpose;
    private Integer totalPhases;
    private Integer currentPhase;
    private BigDecimal progressPercent;
    private String status;
    private UUID createdById;
    private String createdByName;
    private List<PhaseInfo> phases;
    private List<MemberInfo> members;
    private Instant createdAt;

    @Data
    @Builder
    public static class PhaseInfo {
        private UUID id;
        private Integer phaseNumber;
        private String name;
        private Boolean isCompleted;
        private Instant completedAt;
    }

    @Data
    @Builder
    public static class MemberInfo {
        private UUID userId;
        private String fullName;
    }
}
