package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.ShootParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShootParticipantRepository extends JpaRepository<ShootParticipant, UUID> {
    List<ShootParticipant> findByShootId(UUID shootId);
}
