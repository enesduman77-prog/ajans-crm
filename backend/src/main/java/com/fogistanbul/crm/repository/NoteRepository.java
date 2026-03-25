package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, UUID> {
    Page<Note> findByUserId(UUID userId, Pageable pageable);
    Page<Note> findByUserIdAndCompanyId(UUID userId, UUID companyId, Pageable pageable);
    Page<Note> findByUserIdAndIsOpen(UUID userId, Boolean isOpen, Pageable pageable);
}
