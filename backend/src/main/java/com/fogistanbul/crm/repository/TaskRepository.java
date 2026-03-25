package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    Page<Task> findByCompanyId(UUID companyId, Pageable pageable);
    Page<Task> findByCompanyIdIn(List<UUID> companyIds, Pageable pageable);
    Page<Task> findByCompanyIdInAndStatus(List<UUID> companyIds, TaskStatus status, Pageable pageable);

    Page<Task> findByAssignedToId(UUID userId, Pageable pageable);

    List<Task> findByCompanyIdAndStatus(UUID companyId, TaskStatus status);

    long countByCompanyId(UUID companyId);

    long countByStatus(TaskStatus status);

    Page<Task> findByStatus(TaskStatus status, Pageable pageable);

    Page<Task> findByAssignedToIdAndStatus(UUID userId, TaskStatus status, Pageable pageable);

    List<Task> findByCompanyIdIn(List<UUID> companyIds);
}
