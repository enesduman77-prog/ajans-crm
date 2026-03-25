package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.PrProjectPhase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PrProjectPhaseRepository extends JpaRepository<PrProjectPhase, UUID> {
    List<PrProjectPhase> findByProjectIdOrderByPhaseNumber(UUID projectId);
}
