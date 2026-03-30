package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.TaskNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskNoteRepository extends JpaRepository<TaskNote, UUID> {
    List<TaskNote> findByTaskIdOrderByCreatedAtDesc(UUID taskId);
    long countByTaskId(UUID taskId);
}
