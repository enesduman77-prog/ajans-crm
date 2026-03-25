package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.ActivityLogResponse;
import com.fogistanbul.crm.entity.ActivityLog;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.ActivityAction;
import com.fogistanbul.crm.repository.ActivityLogRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional
    public void log(UUID userId, ActivityAction action, String entityType,
                    UUID entityId, String entityName, Map<String, Object> details) {
        String userName = null;
        UserProfile user = null;
        if (userId != null) {
            user = userProfileRepository.findById(userId).orElse(null);
            if (user != null && user.getPerson() != null) {
                userName = user.getPerson().getFullName();
            } else if (user != null) {
                userName = user.getEmail();
            }
        }

        ActivityLog entry = ActivityLog.builder()
                .user(user)
                .userName(userName)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .entityName(entityName)
                .details(details)
                .build();

        activityLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogResponse> getAll(Pageable pageable) {
        return activityLogRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogResponse> getByEntity(String entityType, UUID entityId, Pageable pageable) {
        return activityLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogResponse> getByEntityType(String entityType, Pageable pageable) {
        return activityLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageable)
                .map(this::toResponse);
    }

    private ActivityLogResponse toResponse(ActivityLog a) {
        return ActivityLogResponse.builder()
                .id(a.getId())
                .userId(a.getUser() != null ? a.getUser().getId() : null)
                .userName(a.getUserName())
                .action(a.getAction().name())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .entityName(a.getEntityName())
                .details(a.getDetails())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
