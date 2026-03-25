package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.CreateMeetingRequest;
import com.fogistanbul.crm.dto.MeetingResponse;
import com.fogistanbul.crm.service.MeetingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/staff/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;

    @PostMapping
    public ResponseEntity<MeetingResponse> create(
            @Valid @RequestBody CreateMeetingRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(meetingService.createMeeting(request, userId));
    }

    @GetMapping
    public Page<MeetingResponse> getAll(@PageableDefault(size = 20) Pageable pageable, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return meetingService.getAllMeetings(pageable, userId);
    }

    @GetMapping("/company/{companyId}")
    public Page<MeetingResponse> getByCompany(
            @PathVariable UUID companyId,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return meetingService.getMeetingsByCompany(companyId, pageable, userId);
    }

    @GetMapping("/{id}")
    public MeetingResponse getById(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return meetingService.getMeetingById(id, userId);
    }

    @PutMapping("/{id}/status")
    public MeetingResponse updateStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().iterator().next().getAuthority();
        return meetingService.updateStatus(id, status, userId, role);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().iterator().next().getAuthority();
        meetingService.deleteMeeting(id, userId, role);
        return ResponseEntity.noContent().build();
    }
}
