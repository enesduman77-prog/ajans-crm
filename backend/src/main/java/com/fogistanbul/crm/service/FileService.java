package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.FileAttachmentResponse;
import com.fogistanbul.crm.entity.FileAttachment;
import com.fogistanbul.crm.entity.Message;
import com.fogistanbul.crm.entity.Note;
import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.FileAttachmentRepository;
import com.fogistanbul.crm.repository.MessageRepository;
import com.fogistanbul.crm.repository.NoteRepository;
import com.fogistanbul.crm.repository.TaskRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;
    private static final Set<String> ALLOWED_ENTITY_TYPES = Set.of("MESSAGE", "TASK", "NOTE", "COMPANY");
    private static final List<String> BLOCKED_EXTENSIONS = List.of(
            ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js", ".jar", ".war");

    private final FileAttachmentRepository fileAttachmentRepository;
    private final UserProfileRepository userProfileRepository;
    private final TaskRepository taskRepository;
    private final NoteRepository noteRepository;
    private final MessageRepository messageRepository;
    private final CompanyRepository companyRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;

    @Transactional
    public FileAttachmentResponse upload(MultipartFile file, String entityType, UUID entityId, UUID userId) {
        if (file.isEmpty()) {
            throw new RuntimeException("Bos dosya yuklenemez");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("Dosya boyutu 50MB'i asamaz");
        }

        String normalizedEntityType = normalizeEntityType(entityType);
        UserProfile uploader = getUserOrThrow(userId);
        ensureEntityAccess(normalizedEntityType, entityId, uploader);

        String originalName = file.getOriginalFilename();
        if (originalName != null) {
            String lowerName = originalName.toLowerCase();
            for (String ext : BLOCKED_EXTENSIONS) {
                if (lowerName.endsWith(ext)) {
                    throw new RuntimeException("Bu dosya turu yuklenemez: " + ext);
                }
            }
        }

        String storedName = UUID.randomUUID() + "_" + (originalName != null ? originalName : "file");
        Path uploadPath = Path.of(uploadDir, normalizedEntityType.toLowerCase(), entityId.toString());

        try {
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(storedName);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new RuntimeException("Dosya kaydedilemedi", e);
        }

        FileAttachment attachment = FileAttachment.builder()
                .originalName(originalName != null ? originalName : "file")
                .storedName(storedName)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(uploadPath.resolve(storedName).toString())
                .uploadedBy(uploader)
                .entityType(normalizedEntityType)
                .entityId(entityId)
                .build();

        attachment = fileAttachmentRepository.save(attachment);
        log.info("File uploaded: {} for {}/{}", originalName, normalizedEntityType, entityId);
        return toResponse(attachment);
    }

    @Transactional(readOnly = true)
    public List<FileAttachmentResponse> getByEntity(String entityType, UUID entityId, UUID userId) {
        String normalizedEntityType = normalizeEntityType(entityType);
        UserProfile user = getUserOrThrow(userId);
        ensureEntityAccess(normalizedEntityType, entityId, user);

        return fileAttachmentRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(normalizedEntityType, entityId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FileAttachment getAttachment(UUID fileId, UUID userId) {
        FileAttachment attachment = fileAttachmentRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Dosya bulunamadi"));

        UserProfile user = getUserOrThrow(userId);
        ensureEntityAccess(attachment.getEntityType(), attachment.getEntityId(), user);
        return attachment;
    }

    @Transactional
    public void delete(UUID fileId, UUID userId) {
        FileAttachment attachment = fileAttachmentRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Dosya bulunamadi"));
        UserProfile user = getUserOrThrow(userId);

        boolean admin = user.getGlobalRole() == GlobalRole.ADMIN;
        boolean owner = attachment.getUploadedBy() != null && attachment.getUploadedBy().getId().equals(userId);
        if (!admin && !owner) {
            throw new RuntimeException("Bu dosyayi silme yetkiniz yok");
        }

        try {
            Files.deleteIfExists(Path.of(attachment.getStoragePath()));
        } catch (IOException e) {
            log.warn("Could not delete file from disk: {}", attachment.getStoragePath(), e);
        }

        fileAttachmentRepository.delete(attachment);
        log.info("File deleted: {} by user {}", attachment.getOriginalName(), userId);
    }

    @Transactional(readOnly = true)
    public Page<FileAttachmentResponse> getCompanyMedia(UUID companyId, String filter, int page, int size, UUID userId) {
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() != GlobalRole.ADMIN) {
            ensureCompanyMembership(userId, companyId);
        }

        PageRequest pageable = PageRequest.of(page, size);
        Page<FileAttachment> result;

        if (filter != null && !filter.isBlank()) {
            result = fileAttachmentRepository.findByEntityTypeAndEntityIdAndContentTypeStartingWithOrderByCreatedAtDesc(
                    "COMPANY", companyId, filter, pageable);
        } else {
            result = fileAttachmentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                    "COMPANY", companyId, pageable);
        }

        return result.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public java.util.Map<UUID, Long> getCompanyMediaCounts() {
        java.util.Map<UUID, Long> counts = new java.util.HashMap<>();
        for (Object[] row : fileAttachmentRepository.countByCompanyGrouped()) {
            counts.put((UUID) row[0], (Long) row[1]);
        }
        return counts;
    }

    private String normalizeEntityType(String entityType) {
        if (entityType == null) {
            throw new RuntimeException("Entity type zorunludur");
        }
        String normalized = entityType.trim().toUpperCase();
        if (!ALLOWED_ENTITY_TYPES.contains(normalized)) {
            throw new RuntimeException("Gecersiz entity type");
        }
        return normalized;
    }

    private void ensureEntityAccess(String entityType, UUID entityId, UserProfile user) {
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return;
        }

        switch (entityType) {
            case "TASK" -> {
                Task task = taskRepository.findById(entityId)
                        .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));
                ensureCompanyMembership(user.getId(), task.getCompany().getId());
            }
            case "NOTE" -> {
                Note note = noteRepository.findById(entityId)
                        .orElseThrow(() -> new RuntimeException("Not bulunamadi"));
                boolean ownNote = note.getUser() != null && note.getUser().getId().equals(user.getId());
                boolean companyScoped = note.getCompany() != null
                        && membershipRepository.existsByUserIdAndCompanyId(user.getId(), note.getCompany().getId());
                if (!ownNote && !companyScoped) {
                    throw new RuntimeException("Bu nota erisim yetkiniz yok");
                }
            }
            case "MESSAGE" -> {
                Message message = messageRepository.findById(entityId)
                        .orElseThrow(() -> new RuntimeException("Mesaj bulunamadi"));
                boolean participant = message.getConversation().getUser1().getId().equals(user.getId())
                        || message.getConversation().getUser2().getId().equals(user.getId());
                if (!participant) {
                    throw new RuntimeException("Bu mesaja erisim yetkiniz yok");
                }
            }
            case "COMPANY" -> {
                companyRepository.findById(entityId)
                        .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
                ensureCompanyMembership(user.getId(), entityId);
            }
            default -> throw new RuntimeException("Gecersiz entity type");
        }
    }

    private void ensureCompanyMembership(UUID userId, UUID companyId) {
        if (!membershipRepository.existsByUserIdAndCompanyId(userId, companyId)) {
            throw new RuntimeException("Bu sirket verilerine erisim yetkiniz yok");
        }
    }

    private UserProfile getUserOrThrow(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));
    }

    private FileAttachmentResponse toResponse(FileAttachment f) {
        return FileAttachmentResponse.builder()
                .id(f.getId())
                .originalName(f.getOriginalName())
                .contentType(f.getContentType())
                .fileSize(f.getFileSize())
                .uploadedById(f.getUploadedBy().getId())
                .uploadedByName(f.getUploadedBy().getPerson() != null
                        ? f.getUploadedBy().getPerson().getFullName()
                        : f.getUploadedBy().getEmail())
                .entityType(f.getEntityType())
                .entityId(f.getEntityId())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
