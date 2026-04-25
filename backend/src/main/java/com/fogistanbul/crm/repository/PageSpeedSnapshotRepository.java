package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.PageSpeedSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PageSpeedSnapshotRepository extends JpaRepository<PageSpeedSnapshot, UUID> {
    Optional<PageSpeedSnapshot> findByCompanyIdAndStrategy(UUID companyId, String strategy);
    List<PageSpeedSnapshot> findByCompanyId(UUID companyId);
}
