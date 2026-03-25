package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.CompanyPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyPermissionRepository extends JpaRepository<CompanyPermission, UUID> {
    Optional<CompanyPermission> findByUserIdAndCompanyIdAndPermissionKey(UUID userId, UUID companyId,
            String permissionKey);

    List<CompanyPermission> findByUserIdAndCompanyId(UUID userId, UUID companyId);

    void deleteByUserIdAndCompanyId(UUID userId, UUID companyId);
}
