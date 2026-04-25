package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    Page<Task> findByCompanyId(UUID companyId, Pageable pageable);
    Page<Task> findByCompanyIdIn(List<UUID> companyIds, Pageable pageable);
    Page<Task> findByCompanyIdInAndStatus(List<UUID> companyIds, TaskStatus status, Pageable pageable);

    Page<Task> findByAssignedToId(UUID userId, Pageable pageable);

    List<Task> findByCompanyIdAndStatus(UUID companyId, TaskStatus status);
    Page<Task> findByCompanyIdAndStatus(UUID companyId, TaskStatus status, Pageable pageable);

    long countByCompanyId(UUID companyId);

    void deleteByCompanyId(UUID companyId);

    long countByStatus(TaskStatus status);

    Page<Task> findByStatus(TaskStatus status, Pageable pageable);

    Page<Task> findByAssignedToIdAndStatus(UUID userId, TaskStatus status, Pageable pageable);

    List<Task> findByCompanyIdIn(List<UUID> companyIds);

    @Query("SELECT t FROM Task t WHERE t.company.id IN :companyIds OR t.assignedTo.id = :userId")
    Page<Task> findByCompanyIdInOrAssignedToId(@Param("companyIds") List<UUID> companyIds, @Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE (t.company.id IN :companyIds OR t.assignedTo.id = :userId) AND t.status = :status")
    Page<Task> findByCompanyIdInOrAssignedToIdAndStatus(@Param("companyIds") List<UUID> companyIds, @Param("userId") UUID userId, @Param("status") TaskStatus status, Pageable pageable);

    @Modifying
    @Query("UPDATE Task t SET t.status = 'OVERDUE' WHERE t.status NOT IN ('DONE', 'OVERDUE') AND t.endDate < :now")
    int markOverdueTasks(@Param("now") Instant now);

    boolean existsByRoutineIdAndRoutinePeriodKey(UUID routineId, String routinePeriodKey);

    boolean existsByRoutineIdAndRoutinePeriodKeyAndAssignedToId(UUID routineId, String routinePeriodKey, UUID assignedToId);

    // ─── Staff Analytics ───

    long countByAssignedToIdAndStatus(UUID userId, TaskStatus status);

    long countByAssignedToId(UUID userId);

    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId AND t.status = 'DONE' AND t.completedAt >= :from AND t.completedAt <= :to")
    List<Task> findCompletedByUserInRange(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId AND t.createdAt >= :from AND t.createdAt <= :to")
    List<Task> findCreatedForUserInRange(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

    List<Task> findByAssignedToIdAndStatusNot(UUID userId, TaskStatus status);
}
