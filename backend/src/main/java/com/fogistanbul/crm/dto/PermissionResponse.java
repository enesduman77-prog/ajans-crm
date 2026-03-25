package com.fogistanbul.crm.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionResponse {

    private String id;
    private String userId;
    private String companyId;
    private String permissionKey;
    private String level;
    private String createdAt;
}
