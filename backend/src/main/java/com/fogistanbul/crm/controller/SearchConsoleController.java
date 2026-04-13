package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.ScOverviewResponse;
import com.fogistanbul.crm.service.GoogleOAuthService;
import com.fogistanbul.crm.service.SearchConsoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/client/analytics/sc")
@RequiredArgsConstructor
public class SearchConsoleController {

    private final SearchConsoleService searchConsoleService;
    private final GoogleOAuthService googleOAuthService;

    /** Belirli şirketin SC bağlantı durumu */
    @GetMapping("/status")
    public Map<String, Object> status(@RequestParam UUID companyId) {
        boolean connected = googleOAuthService.isConnected(companyId);
        String siteUrl = googleOAuthService.getSiteUrl(companyId).orElse(null);
        boolean hasScScope = connected && googleOAuthService.hasScScope(companyId);
        boolean needsReconnect = connected && !hasScScope;
        String authUrl = googleOAuthService.buildAuthorizationUrl(companyId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("connected", connected);
        result.put("siteUrl", siteUrl != null ? siteUrl : "");
        result.put("hasScScope", hasScScope);
        result.put("needsReconnect", needsReconnect);
        result.put("authUrl", authUrl);
        return result;
    }

    /** Kullanıcının erişebildiği SC sitelerini listele */
    @GetMapping("/sites")
    public List<Map<String, String>> listSites(@RequestParam UUID companyId) {
        return searchConsoleService.listSites(companyId);
    }

    /** SC verilerini getir */
    @GetMapping("/overview")
    public ScOverviewResponse overview(@RequestParam UUID companyId,
                                       @RequestParam(required = false) String startDate,
                                       @RequestParam(required = false) String endDate) {
        return searchConsoleService.getOverview(companyId, startDate, endDate);
    }

    /** Search Console Site URL'ini kaydet */
    @PostMapping("/site-url")
    public Map<String, String> saveSiteUrl(@RequestParam UUID companyId,
                                            @RequestBody Map<String, String> body) {
        String siteUrl = body.get("siteUrl");
        if (siteUrl == null || siteUrl.isBlank()) {
            return Map.of("error", "siteUrl boş olamaz");
        }
        googleOAuthService.saveSiteUrl(companyId, siteUrl.trim());
        return Map.of("status", "ok");
    }
}
