package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.ChangePasswordRequest;
import com.fogistanbul.crm.dto.UpdateProfileRequest;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.repository.UserProfileRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/client/settings")
@RequiredArgsConstructor
public class ClientSettingsController {

    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @PutMapping("/profile")
    public ResponseEntity<Map<String, String>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.getPerson().setFullName(request.getFullName());
        userProfileRepository.save(user);

        return ResponseEntity.ok(Map.of("fullName", request.getFullName()));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mevcut şifre hatalı"));
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userProfileRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Şifre başarıyla değiştirildi"));
    }
}
