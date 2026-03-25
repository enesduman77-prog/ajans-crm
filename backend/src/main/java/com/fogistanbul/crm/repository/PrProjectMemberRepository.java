package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.PrProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PrProjectMemberRepository extends JpaRepository<PrProjectMember, UUID> {
    List<PrProjectMember> findByProjectId(UUID projectId);
}
