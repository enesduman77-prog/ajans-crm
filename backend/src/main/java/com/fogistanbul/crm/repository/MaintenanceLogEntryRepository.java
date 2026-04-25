package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.MaintenanceLogEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MaintenanceLogEntryRepository extends JpaRepository<MaintenanceLogEntry, UUID> {
    List<MaintenanceLogEntry> findByCompanyIdOrderByPerformedAtDesc(UUID companyId);
}
