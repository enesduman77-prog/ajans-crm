package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.StaffAnalyticsResponse;
import com.fogistanbul.crm.service.StaffAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/staff/analytics")
@RequiredArgsConstructor
public class StaffAnalyticsController {

    private final StaffAnalyticsService analyticsService;

    @GetMapping
    public StaffAnalyticsResponse getMyAnalytics(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return analyticsService.getAnalytics(userId);
    }
}
