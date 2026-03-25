package com.fogistanbul.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {
    private String id;
    private String fullName;
    private String avatarUrl;
    private String globalRole;
    private String email;
    private String companyName;
    private String membershipRole;
    private String positionTitle;
}
