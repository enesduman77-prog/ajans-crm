package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.GroupMessageRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface GroupMessageReadRepository extends JpaRepository<GroupMessageRead, UUID> {

    boolean existsByMessageIdAndUserId(UUID messageId, UUID userId);

    @Query("SELECT r.message.id FROM GroupMessageRead r WHERE r.message.id IN :messageIds AND r.user.id = :userId")
    List<UUID> findReadMessageIds(@Param("messageIds") List<UUID> messageIds, @Param("userId") UUID userId);

    @Modifying
    @Query(value = """
            INSERT INTO group_message_reads (id, message_id, user_id, read_at)
            SELECT gen_random_uuid(), gm.id, :userId, now()
            FROM group_messages gm
            WHERE gm.group_id = :groupId
              AND gm.sender_id <> :userId
              AND NOT EXISTS (
                  SELECT 1 FROM group_message_reads r WHERE r.message_id = gm.id AND r.user_id = :userId
              )
            """, nativeQuery = true)
    int markAllAsRead(@Param("groupId") UUID groupId, @Param("userId") UUID userId);
}
