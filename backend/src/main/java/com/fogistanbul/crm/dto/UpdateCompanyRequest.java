package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateCompanyRequest {
    @NotBlank(message = "Şirket adı zorunludur")
    private String name;

    private String industry;
    private String taxId;
    private Integer foundedYear;
    private String vision;
    private String mission;
    private Integer employeeCount;

    @Email(message = "Geçerli bir email giriniz")
    private String email;
    private String phone;
    private String address;
    private String website;

    private String socialInstagram;
    private String socialFacebook;
    private String socialTwitter;
    private String socialLinkedin;
    private String socialYoutube;
    private String socialTiktok;

    private String notes;

    private String hostingProvider;
    private LocalDate domainExpiry;
    private LocalDate sslExpiry;
    private String cmsType;
    private String cmsVersion;
    private String themeName;
}
