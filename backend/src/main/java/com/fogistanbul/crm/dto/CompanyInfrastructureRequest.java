package com.fogistanbul.crm.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CompanyInfrastructureRequest {
    private String hostingProvider;
    private LocalDate domainExpiry;
    private LocalDate sslExpiry;
    private String cmsType;
    private String cmsVersion;
    private String themeName;
}
