package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.NotificationPreferenceResponse;
import com.fogistanbul.crm.dto.UpdateNotificationPreferenceRequest;
import com.fogistanbul.crm.service.NotificationPreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    @GetMapping
    public List<NotificationPreferenceResponse> getPreferences(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return preferenceService.getPreferences(userId);
    }

    @PutMapping
    public NotificationPreferenceResponse update(
            @Valid @RequestBody UpdateNotificationPreferenceRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return preferenceService.updatePreference(userId, request);
    }
}
