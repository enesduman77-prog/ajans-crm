package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.ApprovalRequestResponse;
import com.fogistanbul.crm.service.ApprovalRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/approval-requests")
@RequiredArgsConstructor
public class StaffApprovalController {

    private final ApprovalRequestService approvalRequestService;

    @GetMapping
    public ResponseEntity<List<ApprovalRequestResponse>> getAll() {
        return ResponseEntity.ok(approvalRequestService.getAll());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ApprovalRequestResponse>> getPending() {
        return ResponseEntity.ok(approvalRequestService.getPending());
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> countPending() {
        return ResponseEntity.ok(Map.of("count", approvalRequestService.countPending()));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApprovalRequestResponse> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String note = body != null ? (String) body.get("note") : null;
        return ResponseEntity.ok(approvalRequestService.approve(id, userId, note, body));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApprovalRequestResponse> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String note = body != null ? body.get("note") : null;
        return ResponseEntity.ok(approvalRequestService.reject(id, userId, note));
    }
}
