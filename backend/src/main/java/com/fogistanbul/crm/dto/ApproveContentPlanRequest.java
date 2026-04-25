package com.fogistanbul.crm.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class ApproveContentPlanRequest {
    private UUID companyId;
    private String shootTitle;
    private String shootDescription;
    private String shootDate;
    private String shootTime;
    private String location;
}
