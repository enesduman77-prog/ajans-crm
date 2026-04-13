package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.ShootEquipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShootEquipmentRepository extends JpaRepository<ShootEquipment, UUID> {
    List<ShootEquipment> findByShootId(UUID shootId);
    void deleteByShootId(UUID shootId);
}
