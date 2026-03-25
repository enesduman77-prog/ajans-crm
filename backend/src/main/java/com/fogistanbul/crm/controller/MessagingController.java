package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.*;
import com.fogistanbul.crm.service.MessagingService;
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
@RequestMapping("/api/staff/messaging")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService messagingService;

    @PostMapping("/conversations/start/{targetUserId}")
    public ResponseEntity<ConversationResponse> startConversation(
            @PathVariable UUID targetUserId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messagingService.getOrStartConversation(userId, targetUserId));
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<ContactResponse>> getContacts(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(messagingService.getContacts(userId));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getMyConversations(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(messagingService.getMyConversations(userId));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable UUID conversationId,
            @Valid @RequestBody SendMessageRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messagingService.sendMessage(conversationId, request, userId));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(messagingService.getMessages(conversationId, userId, page, size));
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID conversationId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        messagingService.markConversationAsRead(conversationId, userId);
        return ResponseEntity.ok().build();
    }

}
