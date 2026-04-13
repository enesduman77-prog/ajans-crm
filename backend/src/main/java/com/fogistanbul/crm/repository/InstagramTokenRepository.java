package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.InstagramToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InstagramTokenRepository extends JpaRepository<InstagramToken, UUID> {
    Optional<InstagramToken> findByCompanyId(UUID companyId);
    boolean existsByCompanyId(UUID companyId);
    void deleteByCompanyId(UUID companyId);
}
