package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.Meeting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MeetingRepository extends JpaRepository<Meeting, UUID> {
    Page<Meeting> findByCompanyId(UUID companyId, Pageable pageable);
    Page<Meeting> findByCompanyIdIn(List<UUID> companyIds, Pageable pageable);
    Page<Meeting> findByCreatedById(UUID userId, Pageable pageable);
    List<Meeting> findByCompanyIdIn(List<UUID> companyIds);
}
