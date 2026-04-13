package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.PrPhaseNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PrPhaseNoteRepository extends JpaRepository<PrPhaseNote, UUID> {
    List<PrPhaseNote> findByPhaseIdOrderByCreatedAtDesc(UUID phaseId);
    List<PrPhaseNote> findByPhaseProjectIdOrderByCreatedAtDesc(UUID projectId);
}
