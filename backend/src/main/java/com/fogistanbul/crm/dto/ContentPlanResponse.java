package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContentPlanResponse {
    private String id;
    private String companyId;
    private String companyName;
    private String createdById;
    private String createdByName;
    private String title;
    private String description;
    private String authorName;
    private String platform;
    private String contentSize;
    private String direction;
    private String speakerModel;
    private String status;
    private String revisionNote;
    private String plannedDate;
    private String shootId;
    private String shootDate;
    private String shootTitle;
    private String createdAt;
    private String updatedAt;
}
