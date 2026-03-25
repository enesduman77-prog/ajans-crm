package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.GroupConversationResponse;
import com.fogistanbul.crm.dto.GroupMessageResponse;
import com.fogistanbul.crm.dto.SendMessageRequest;
import com.fogistanbul.crm.service.GroupMessagingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/messaging/groups")
@RequiredArgsConstructor
public class GroupMessagingController {

    private final GroupMessagingService groupMessagingService;

    @GetMapping
    public ResponseEntity<List<GroupConversationResponse>> getMyGroups(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(groupMessagingService.getMyGroups(userId));
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<Page<GroupMessageResponse>> getMessages(
            @PathVariable UUID groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(groupMessagingService.getMessages(groupId, userId, page, size));
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<GroupMessageResponse> sendMessage(
            @PathVariable UUID groupId,
            @Valid @RequestBody SendMessageRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupMessagingService.sendMessage(groupId, request, userId));
    }

    @PostMapping("/{groupId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID groupId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        groupMessagingService.markAsRead(groupId, userId);
        return ResponseEntity.ok().build();
    }
}
