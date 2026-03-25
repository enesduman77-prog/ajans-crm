package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.GroupMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupMessageRepository extends JpaRepository<GroupMessage, UUID> {

    Page<GroupMessage> findByGroupIdOrderByCreatedAtAsc(UUID groupId, Pageable pageable);

    Optional<GroupMessage> findFirstByGroupIdOrderByCreatedAtDesc(UUID groupId);

    long countByGroupId(UUID groupId);

    @Query("""
            SELECT gm.group.id, COUNT(gm)
            FROM GroupMessage gm
            WHERE gm.group.id IN :groupIds
              AND gm.sender.id <> :userId
              AND NOT EXISTS (
                  SELECT 1 FROM GroupMessageRead r WHERE r.message = gm AND r.user.id = :userId
              )
            GROUP BY gm.group.id
            """)
    List<Object[]> countUnreadByGroupIds(@Param("groupIds") List<UUID> groupIds, @Param("userId") UUID userId);
}
