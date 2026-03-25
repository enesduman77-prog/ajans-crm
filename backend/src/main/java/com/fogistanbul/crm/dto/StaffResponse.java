package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StaffResponse {
    private String id;
    private String fullName;
    private String email;
    private String phone;
    private String position;
    private String department;
    private String avatarUrl;
    private String globalRole;

    private List<AssignedCompany> assignedCompanies;

    @Data
    @Builder
    public static class AssignedCompany {
        private String membershipId;
        private String companyId;
        private String companyName;
        private String membershipRole;
    }
}
