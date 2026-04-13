package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.MeetingNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MeetingNoteRepository extends JpaRepository<MeetingNote, UUID> {
    List<MeetingNote> findByMeetingId(UUID meetingId);
    Optional<MeetingNote> findByMeetingIdAndUserId(UUID meetingId, UUID userId);
    boolean existsByMeetingIdAndUserId(UUID meetingId, UUID userId);
}
