package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.StartTimerRequest;
import com.fogistanbul.crm.dto.TimeEntryResponse;
import com.fogistanbul.crm.service.TimeTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/staff/time-tracking")
@RequiredArgsConstructor
public class TimeTrackingController {

    private final TimeTrackingService timeTrackingService;

    @PostMapping("/start")
    public ResponseEntity<TimeEntryResponse> start(
            @Valid @RequestBody StartTimerRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(timeTrackingService.startTimer(request, userId));
    }

    @PostMapping("/stop")
    public ResponseEntity<TimeEntryResponse> stop(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(timeTrackingService.stopTimer(userId));
    }

    @GetMapping("/running")
    public ResponseEntity<TimeEntryResponse> getRunning(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        TimeEntryResponse running = timeTrackingService.getRunningTimer(userId);
        return running != null ? ResponseEntity.ok(running) : ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    public Page<TimeEntryResponse> getMyEntries(
            Authentication auth,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = (UUID) auth.getPrincipal();
        return timeTrackingService.getMyEntries(userId, pageable);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        timeTrackingService.deleteEntry(id, userId);
        return ResponseEntity.noContent().build();
    }
}
