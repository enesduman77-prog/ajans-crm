package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.FileAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FileAttachmentRepository extends JpaRepository<FileAttachment, UUID> {

    List<FileAttachment> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId);

    List<FileAttachment> findByUploadedByIdOrderByCreatedAtDesc(UUID userId);
}
