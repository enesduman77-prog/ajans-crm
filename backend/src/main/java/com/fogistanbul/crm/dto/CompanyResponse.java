package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class CompanyResponse {
    private String id;
    private String kind;
    private String name;
    private String industry;
    private String taxId;
    private Integer foundedYear;
    private String email;
    private String phone;
    private String address;
    private String website;
    private String logoUrl;
    private String contractStatus;
    private String notes;

    private String socialInstagram;
    private String socialFacebook;
    private String socialTwitter;
    private String socialLinkedin;
    private String socialYoutube;
    private String socialTiktok;

    private String hostingProvider;
    private LocalDate domainExpiry;
    private LocalDate sslExpiry;
    private String cmsType;
    private String cmsVersion;
    private String themeName;

    private Instant createdAt;
    private int memberCount;
    private int employeeCount;
    private int staffCount;
    private int taskCount;

    private List<MembershipInfo> members;

    @Data
    @Builder
    public static class MembershipInfo {
        private String id;
        private String userId;
        private String fullName;
        private String email;
        private String membershipRole;
        private String globalRole;
        private String avatarUrl;
    }
}
