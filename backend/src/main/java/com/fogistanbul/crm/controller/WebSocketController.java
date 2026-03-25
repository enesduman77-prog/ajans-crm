package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.SendMessageRequest;
import com.fogistanbul.crm.service.MessagingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final MessagingService messagingService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{conversationId}")
    public void handleMessage(
            @DestinationVariable UUID conversationId,
            @Payload SendMessageRequest request,
            Principal principal) {

        UUID userId = extractUserId(principal);
        messagingService.sendMessage(conversationId, request, userId);

        log.info("WebSocket handleMessage called for conversation {}", conversationId);
    }

    public void sendNotification(UUID userId, Object payload) {
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                payload);
    }

    private UUID extractUserId(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            return (UUID) auth.getPrincipal();
        }
        throw new RuntimeException("Kimlik doğrulama hatası");
    }
}
