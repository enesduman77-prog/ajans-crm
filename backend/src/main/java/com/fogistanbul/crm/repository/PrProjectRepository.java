package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.PrProject;
import com.fogistanbul.crm.entity.enums.PrProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PrProjectRepository extends JpaRepository<PrProject, UUID> {
    Page<PrProject> findByCompanyId(UUID companyId, Pageable pageable);
    Page<PrProject> findByCompanyIdIn(List<UUID> companyIds, Pageable pageable);
    Page<PrProject> findByStatus(PrProjectStatus status, Pageable pageable);

    @Query("SELECT p FROM PrProject p WHERE p.company.id IN :companyIds OR p.company IS NULL OR p.responsible.id = :userId OR p.createdBy.id = :userId")
    Page<PrProject> findAccessibleProjects(@Param("companyIds") List<UUID> companyIds, @Param("userId") UUID userId, Pageable pageable);
}
