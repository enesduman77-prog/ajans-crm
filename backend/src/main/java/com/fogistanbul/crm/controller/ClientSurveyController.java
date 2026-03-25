package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.CreateSurveyRequest;
import com.fogistanbul.crm.dto.SurveyResponse;
import com.fogistanbul.crm.entity.CompanyMembership;
import com.fogistanbul.crm.entity.enums.MembershipRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.service.SurveyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/client/surveys")
@RequiredArgsConstructor
public class ClientSurveyController {

    private final SurveyService surveyService;
    private final CompanyMembershipRepository membershipRepository;

    @PostMapping
    public ResponseEntity<SurveyResponse> submit(
            Authentication auth,
            @Valid @RequestBody CreateSurveyRequest request) {
        UUID userId = (UUID) auth.getPrincipal();
        List<CompanyMembership> memberships = membershipRepository.findByUserId(userId);
        boolean isOwner = memberships.stream()
                .anyMatch(m -> m.getMembershipRole() == MembershipRole.OWNER);
        if (!isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(surveyService.submitSurvey(userId, request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<SurveyResponse>> getMySurveys(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(surveyService.getMySurveys(userId));
    }
}
