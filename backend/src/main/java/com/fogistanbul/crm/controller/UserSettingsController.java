package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.ChangePasswordRequest;
import com.fogistanbul.crm.dto.UpdateProfileRequest;
import com.fogistanbul.crm.entity.Person;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.repository.PersonRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserProfileRepository userProfileRepository;
    private final PersonRepository personRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

    @Transactional
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

    @Transactional
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file, Authentication auth) throws IOException {
        UUID userId = (UUID) auth.getPrincipal();
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dosya boş"));
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dosya 5MB'dan büyük olamaz"));
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Sadece resim dosyaları yüklenebilir"));
        }

        String ext = "";
        String origName = file.getOriginalFilename();
        if (origName != null && origName.contains(".")) {
            ext = origName.substring(origName.lastIndexOf('.'));
        }
        String storedName = UUID.randomUUID() + ext;

        Path avatarDir = Paths.get(uploadDir, "avatar", userId.toString());
        Files.createDirectories(avatarDir);
        Path target = avatarDir.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String avatarUrl = "/api/settings/avatar/" + userId + "/" + storedName;
        Person person = user.getPerson();
        person.setAvatarUrl(avatarUrl);
        personRepository.save(person);

        return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl));
    }

    @GetMapping("/avatar/{userId}/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> getAvatar(
            @PathVariable UUID userId, @PathVariable String fileName) throws IOException {
        // Sanitize fileName to prevent path traversal
        String sanitized = Paths.get(fileName).getFileName().toString();
        Path filePath = Paths.get(uploadDir, "avatar", userId.toString(), sanitized);
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        org.springframework.core.io.Resource resource = new UrlResource(filePath.toUri());
        String contentType = Files.probeContentType(filePath);
        if (contentType == null) contentType = "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }
}
