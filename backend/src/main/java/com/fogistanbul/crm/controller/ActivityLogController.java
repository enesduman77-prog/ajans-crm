package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.ActivityLogResponse;
import com.fogistanbul.crm.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    public Page<ActivityLogResponse> getAll(@PageableDefault(size = 30) Pageable pageable) {
        return activityLogService.getAll(pageable);
    }

    @GetMapping("/entity/{entityType}")
    public Page<ActivityLogResponse> getByEntityType(
            @PathVariable String entityType,
            @PageableDefault(size = 30) Pageable pageable) {
        return activityLogService.getByEntityType(entityType, pageable);
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public Page<ActivityLogResponse> getByEntity(
            @PathVariable String entityType,
            @PathVariable UUID entityId,
            @PageableDefault(size = 30) Pageable pageable) {
        return activityLogService.getByEntity(entityType, entityId, pageable);
    }
}
