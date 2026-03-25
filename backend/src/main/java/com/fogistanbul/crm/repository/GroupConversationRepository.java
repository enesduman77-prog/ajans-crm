package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.GroupConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GroupConversationRepository extends JpaRepository<GroupConversation, UUID> {
    Optional<GroupConversation> findByCompanyId(UUID companyId);
}
