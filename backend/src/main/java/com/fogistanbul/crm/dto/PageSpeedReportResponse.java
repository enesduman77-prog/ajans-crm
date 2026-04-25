package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class PageSpeedReportResponse {
    private String websiteUrl;
    private boolean configured;
    private PageSpeedScoreResponse mobile;
    private PageSpeedScoreResponse desktop;

    private String hostingProvider;
    private LocalDate domainExpiry;
    private LocalDate sslExpiry;
    private String cmsType;
    private String cmsVersion;
    private String themeName;
}
