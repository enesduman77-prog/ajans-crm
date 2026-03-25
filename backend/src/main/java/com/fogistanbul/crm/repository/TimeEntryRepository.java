package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.TimeEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, UUID> {

    Page<TimeEntry> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    Page<TimeEntry> findByTaskIdOrderByStartedAtDesc(UUID taskId, Pageable pageable);

    Optional<TimeEntry> findByUserIdAndIsRunningTrue(UUID userId);

    @Query("SELECT t FROM TimeEntry t WHERE t.user.id = :userId AND t.startedAt >= :from AND t.startedAt <= :to ORDER BY t.startedAt DESC")
    List<TimeEntry> findByUserIdAndDateRange(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COALESCE(SUM(t.durationMinutes), 0) FROM TimeEntry t WHERE t.user.id = :userId AND t.startedAt >= :from AND t.startedAt <= :to")
    int sumDurationByUserAndDateRange(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COALESCE(SUM(t.durationMinutes), 0) FROM TimeEntry t WHERE t.company.id = :companyId AND t.startedAt >= :from AND t.startedAt <= :to")
    int sumDurationByCompanyAndDateRange(@Param("companyId") UUID companyId, @Param("from") Instant from, @Param("to") Instant to);
}
