package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.ContentPlan;
import com.fogistanbul.crm.entity.enums.ContentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ContentPlanRepository extends JpaRepository<ContentPlan, UUID> {
    Page<ContentPlan> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);
    Page<ContentPlan> findByCompanyIdAndStatusOrderByCreatedAtDesc(UUID companyId, ContentStatus status, Pageable pageable);
    Page<ContentPlan> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<ContentPlan> findByShootId(UUID shootId);
    long countByShootId(UUID shootId);
}
