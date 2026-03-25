package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.NotificationPreferenceResponse;
import com.fogistanbul.crm.dto.UpdateNotificationPreferenceRequest;
import com.fogistanbul.crm.entity.NotificationPreference;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.NotificationType;
import com.fogistanbul.crm.repository.NotificationPreferenceRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public List<NotificationPreferenceResponse> getPreferences(UUID userId) {
        Map<String, NotificationPreference> existing = preferenceRepository.findByUserId(userId)
                .stream()
                .collect(Collectors.toMap(NotificationPreference::getNotificationType, p -> p));

        return Arrays.stream(NotificationType.values())
                .map(type -> {
                    NotificationPreference pref = existing.get(type.name());
                    return NotificationPreferenceResponse.builder()
                            .notificationType(type.name())
                            .inApp(pref != null ? Boolean.TRUE.equals(pref.getInApp()) : true)
                            .email(pref != null ? Boolean.TRUE.equals(pref.getEmail()) : false)
                            .build();
                })
                .toList();
    }

    @Transactional
    public NotificationPreferenceResponse updatePreference(UUID userId, UpdateNotificationPreferenceRequest request) {
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        NotificationPreference pref = preferenceRepository
                .findByUserIdAndNotificationType(userId, request.getNotificationType())
                .orElseGet(() -> NotificationPreference.builder()
                        .user(user)
                        .notificationType(request.getNotificationType())
                        .build());

        pref.setInApp(request.isInApp());
        pref.setEmail(request.isEmail());
        preferenceRepository.save(pref);

        return NotificationPreferenceResponse.builder()
                .notificationType(pref.getNotificationType())
                .inApp(Boolean.TRUE.equals(pref.getInApp()))
                .email(Boolean.TRUE.equals(pref.getEmail()))
                .build();
    }
}
