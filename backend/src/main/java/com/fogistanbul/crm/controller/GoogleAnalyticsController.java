package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.GaOverviewResponse;
import com.fogistanbul.crm.service.GoogleAnalyticsService;
import com.fogistanbul.crm.service.GoogleOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/client/analytics/ga")
@RequiredArgsConstructor
public class GoogleAnalyticsController {

    private final GoogleAnalyticsService googleAnalyticsService;
    private final GoogleOAuthService googleOAuthService;

    /** Belirli şirketin GA bağlantı durumu ve auth URL'i */
    @GetMapping("/status")
    public Map<String, Object> status(@RequestParam UUID companyId) {
        boolean connected = googleOAuthService.isConnected(companyId);
        String propertyId = googleOAuthService.getPropertyId(companyId).orElse(null);
        String authUrl = connected ? null : googleOAuthService.buildAuthorizationUrl(companyId);
        return Map.of(
                "connected", connected,
                "propertyId", propertyId != null ? propertyId : "",
                "authUrl", authUrl != null ? authUrl : ""
        );
    }

    /** GA4 verilerini getir */
    @GetMapping("/overview")
    public GaOverviewResponse overview(@RequestParam UUID companyId) {
        return googleAnalyticsService.getOverview(companyId);
    }

    /** GA4 Property ID'yi kaydet */
    @PostMapping("/property")
    public Map<String, String> saveProperty(@RequestParam UUID companyId,
                                             @RequestBody Map<String, String> body) {
        String propertyId = body.get("propertyId");
        if (propertyId == null || propertyId.isBlank()) {
            return Map.of("error", "propertyId boş olamaz");
        }
        googleOAuthService.savePropertyId(companyId, propertyId.trim());
        return Map.of("status", "ok");
    }

    /** GA bağlantısını kes */
    @DeleteMapping("/disconnect")
    public Map<String, String> disconnect(@RequestParam UUID companyId) {
        googleOAuthService.disconnect(companyId);
        return Map.of("status", "ok");
    }
}

