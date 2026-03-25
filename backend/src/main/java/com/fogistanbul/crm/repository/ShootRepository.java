package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.Shoot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShootRepository extends JpaRepository<Shoot, UUID> {
    Page<Shoot> findByCompanyId(UUID companyId, Pageable pageable);
    Page<Shoot> findByCompanyIdIn(List<UUID> companyIds, Pageable pageable);
    List<Shoot> findByCompanyIdIn(List<UUID> companyIds);
}
