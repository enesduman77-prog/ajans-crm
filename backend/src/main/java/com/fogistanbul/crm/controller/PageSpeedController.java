package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.PageSpeedReportResponse;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.service.PageSpeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PageSpeedController {

    private final PageSpeedService pageSpeedService;
    private final CompanyMembershipRepository membershipRepository;

    @GetMapping("/api/staff/companies/{companyId}/pagespeed")
    public PageSpeedReportResponse getStaff(
            @PathVariable UUID companyId,
            @RequestParam(defaultValue = "false") boolean refresh,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().iterator().next().getAuthority();
        return pageSpeedService.getReport(companyId, userId, role, refresh);
    }

    @GetMapping("/api/client/pagespeed")
    public PageSpeedReportResponse getClient(
            @RequestParam(defaultValue = "false") boolean refresh,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().iterator().next().getAuthority();
        List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        if (companyIds.isEmpty()) {
            return PageSpeedReportResponse.builder().configured(false).build();
        }
        return pageSpeedService.getReport(companyIds.get(0), userId, role, refresh);
    }
}
