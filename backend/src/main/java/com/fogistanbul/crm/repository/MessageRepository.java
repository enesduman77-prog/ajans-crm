package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByConversationIdOrderByCreatedAtAsc(UUID conversationId, Pageable pageable);

    long countByConversationId(UUID conversationId);

    long countByConversationIdAndIsReadFalseAndSenderIdNot(UUID conversationId, UUID userId);

    long countByConversationIdAndIsApprovalPendingTrue(UUID conversationId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversation.id = :conversationId AND m.sender.id <> :userId AND m.isRead = false")
    int markAsReadByConversationAndNotSender(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);

    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    // Batch queries for conversation list optimization
    @Query("SELECT m.conversation.id, COUNT(m) FROM Message m WHERE m.conversation.id IN :conversationIds GROUP BY m.conversation.id")
    List<Object[]> countByConversationIds(@Param("conversationIds") List<UUID> conversationIds);

    @Query("SELECT m.conversation.id, COUNT(m) FROM Message m WHERE m.conversation.id IN :conversationIds AND m.isRead = false AND m.sender.id <> :userId GROUP BY m.conversation.id")
    List<Object[]> countUnreadByConversationIds(@Param("conversationIds") List<UUID> conversationIds, @Param("userId") UUID userId);
}
