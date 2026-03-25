package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.TaskReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskReviewRepository extends JpaRepository<TaskReview, UUID> {
    List<TaskReview> findByTaskId(UUID taskId);
    Optional<TaskReview> findByTaskIdAndReviewerId(UUID taskId, UUID reviewerId);
    boolean existsByTaskIdAndReviewerId(UUID taskId, UUID reviewerId);
}
