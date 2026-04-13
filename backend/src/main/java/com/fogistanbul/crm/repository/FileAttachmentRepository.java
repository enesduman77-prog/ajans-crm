package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.FileAttachment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface FileAttachmentRepository extends JpaRepository<FileAttachment, UUID> {

    List<FileAttachment> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId);

    List<FileAttachment> findByUploadedByIdOrderByCreatedAtDesc(UUID userId);

    Page<FileAttachment> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId, Pageable pageable);

    Page<FileAttachment> findByEntityTypeAndEntityIdAndContentTypeStartingWithOrderByCreatedAtDesc(
            String entityType, UUID entityId, String contentTypePrefix, Pageable pageable);

    @Query("SELECT f.entityId, COUNT(f) FROM FileAttachment f WHERE f.entityType = 'COMPANY' GROUP BY f.entityId")
    List<Object[]> countByCompanyGrouped();

    long countByEntityTypeAndEntityId(String entityType, UUID entityId);
}
