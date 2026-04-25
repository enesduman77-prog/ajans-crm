package com.fogistanbul.crm.dto;

import lombok.Data;

@Data
public class UpdateContentPlanRequest {
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
}
