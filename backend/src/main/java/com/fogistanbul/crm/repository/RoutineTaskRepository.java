package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.RoutineTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RoutineTaskRepository extends JpaRepository<RoutineTask, UUID> {

    Page<RoutineTask> findByIsActiveTrue(Pageable pageable);

    List<RoutineTask> findByIsActiveTrue();

    @Query("SELECT r FROM RoutineTask r WHERE r.isActive = true AND (r.assignedTo IS NULL OR r.assignedTo.id = :userId)")
    List<RoutineTask> findActiveRoutinesForUser(@Param("userId") UUID userId);

    List<RoutineTask> findByAssignedToId(UUID userId);

    long countByIsActiveTrue();
}
