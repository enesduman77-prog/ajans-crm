package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.ApprovalRequestResponse;
import com.fogistanbul.crm.entity.enums.RequestType;
import com.fogistanbul.crm.service.ApprovalRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/client/approval-requests")
@RequiredArgsConstructor
public class ClientApprovalController {

    private final ApprovalRequestService approvalRequestService;

    @PostMapping
    public ResponseEntity<ApprovalRequestResponse> create(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();

        String type = body.getOrDefault("type", "CONTENT_APPROVAL");
        UUID referenceId = body.containsKey("referenceId") ? UUID.fromString(body.get("referenceId")) : null;
        UUID companyId = UUID.fromString(body.get("companyId"));
        String title = body.get("title");
        String description = body.get("description");
        String metadata = body.get("metadata");

        return ResponseEntity.ok(approvalRequestService.create(
                RequestType.valueOf(type), referenceId, companyId, userId, title, description, metadata
        ));
    }
}
