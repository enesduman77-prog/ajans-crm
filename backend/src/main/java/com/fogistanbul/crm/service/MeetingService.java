package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.CreateMeetingRequest;
import com.fogistanbul.crm.dto.MeetingNoteRequest;
import com.fogistanbul.crm.dto.MeetingResponse;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.Meeting;
import com.fogistanbul.crm.entity.MeetingNote;
import com.fogistanbul.crm.entity.MeetingParticipant;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.MeetingStatus;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.MeetingNoteRepository;
import com.fogistanbul.crm.repository.MeetingParticipantRepository;
import com.fogistanbul.crm.repository.MeetingRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final MeetingParticipantRepository participantRepository;
    private final MeetingNoteRepository meetingNoteRepository;
    private final CompanyRepository companyRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional
    public MeetingResponse createMeeting(CreateMeetingRequest req, UUID createdById) {
        Company company = null;
        if (req.getCompanyId() != null) {
            company = companyRepository.findById(req.getCompanyId())
                    .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
        }
        UserProfile creator = getUserOrThrow(createdById);
        if (company != null) {
            ensureCompanyAccess(creator, company.getId());
        }

        Meeting meeting = Meeting.builder()
                .company(company)
                .title(req.getTitle())
                .description(req.getDescription())
                .meetingDate(req.getMeetingDate())
                .durationMinutes(req.getDurationMinutes())
                .location(req.getLocation())
                .createdBy(creator)
                .build();
        meeting = meetingRepository.save(meeting);

        if (req.getParticipantIds() != null) {
            for (UUID participantId : req.getParticipantIds()) {
                UserProfile participant = userProfileRepository.findById(participantId).orElse(null);
                if (participant != null) {
                    participantRepository.save(MeetingParticipant.builder()
                            .meeting(meeting)
                            .user(participant)
                            .build());
                }
            }
        }

        log.info("Meeting created: {}{}", meeting.getTitle(),
                company != null ? " for company " + company.getName() : " (agency internal)");
        return toResponse(meeting);
    }

    @Transactional(readOnly = true)
    public Page<MeetingResponse> getAllMeetings(Pageable pageable, UUID userId) {
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() == GlobalRole.ADMIN || user.getGlobalRole() == GlobalRole.AGENCY_STAFF) {
            return meetingRepository.findAll(pageable).map(this::toResponse);
        }

        List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        if (companyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return meetingRepository.findByCompanyIdIn(companyIds, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<MeetingResponse> getMeetingsByCompany(UUID companyId, Pageable pageable, UUID userId) {
        ensureCompanyAccess(getUserOrThrow(userId), companyId);
        return meetingRepository.findByCompanyId(companyId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public MeetingResponse getMeetingById(UUID meetingId, UUID userId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Toplanti bulunamadi"));
        if (meeting.getCompany() != null) {
            ensureCompanyAccess(getUserOrThrow(userId), meeting.getCompany().getId());
        }
        return toResponse(meeting);
    }

    @Transactional
    public MeetingResponse updateStatus(UUID meetingId, String status, UUID userId, String role) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Toplanti bulunamadi"));
        if (meeting.getCompany() != null) {
            ensureCompanyAccess(getUserOrThrow(userId), meeting.getCompany().getId());
        }
        if (!"ROLE_ADMIN".equals(role) && !meeting.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Bu toplantiyi guncelleme yetkiniz yok");
        }
        meeting.setStatus(MeetingStatus.valueOf(status));
        meeting = meetingRepository.save(meeting);
        return toResponse(meeting);
    }

    @Transactional
    public MeetingResponse completeMeeting(UUID meetingId, MeetingNoteRequest noteReq, UUID userId, String role) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Toplanti bulunamadi"));
        if (meeting.getCompany() != null) {
            ensureCompanyAccess(getUserOrThrow(userId), meeting.getCompany().getId());
        }

        // Only creator or admin can complete the meeting
        if (!"ROLE_ADMIN".equals(role) && !meeting.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Bu toplantiyi tamamlama yetkiniz yok");
        }

        meeting.setStatus(MeetingStatus.COMPLETED);
        meeting = meetingRepository.save(meeting);

        // Save the completing user's notes
        saveNote(meeting, userId, noteReq.getContent());

        log.info("Meeting completed: {} by user {}", meeting.getTitle(), userId);
        return toResponse(meeting);
    }

    @Transactional
    public MeetingResponse addMeetingNote(UUID meetingId, MeetingNoteRequest noteReq, UUID userId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Toplanti bulunamadi"));
        if (meeting.getCompany() != null) {
            ensureCompanyAccess(getUserOrThrow(userId), meeting.getCompany().getId());
        }

        // Only participants or creator can add notes
        boolean isParticipant = participantRepository.findByMeetingId(meetingId)
                .stream().anyMatch(p -> p.getUser().getId().equals(userId));
        boolean isCreator = meeting.getCreatedBy().getId().equals(userId);
        if (!isParticipant && !isCreator) {
            throw new RuntimeException("Bu toplantiya not ekleme yetkiniz yok");
        }

        saveNote(meeting, userId, noteReq.getContent());
        return toResponse(meeting);
    }

    private void saveNote(Meeting meeting, UUID userId, String content) {
        UserProfile user = getUserOrThrow(userId);
        MeetingNote existing = meetingNoteRepository.findByMeetingIdAndUserId(meeting.getId(), userId).orElse(null);
        if (existing != null) {
            existing.setContent(content);
            meetingNoteRepository.save(existing);
        } else {
            meetingNoteRepository.save(MeetingNote.builder()
                    .meeting(meeting)
                    .user(user)
                    .content(content)
                    .build());
        }
    }

    @Transactional
    public void deleteMeeting(UUID meetingId, UUID userId, String role) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Toplanti bulunamadi"));
        if (meeting.getCompany() != null) {
            ensureCompanyAccess(getUserOrThrow(userId), meeting.getCompany().getId());
        }
        if (!"ROLE_ADMIN".equals(role) && !meeting.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Bu toplantiyi silme yetkiniz yok");
        }
        meetingRepository.delete(meeting);
    }

    private void ensureCompanyAccess(UserProfile user, UUID companyId) {
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return;
        }
        if (!membershipRepository.existsByUserIdAndCompanyId(user.getId(), companyId)) {
            throw new RuntimeException("Bu sirket verilerine erisim yetkiniz yok");
        }
    }

    private UserProfile getUserOrThrow(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));
    }

    private MeetingResponse toResponse(Meeting meeting) {
        List<MeetingParticipant> participants = participantRepository.findByMeetingId(meeting.getId());
        List<MeetingNote> notes = meetingNoteRepository.findByMeetingId(meeting.getId());
        var noteUserIds = notes.stream().map(n -> n.getUser().getId()).toList();

        return MeetingResponse.builder()
                .id(meeting.getId())
                .companyId(meeting.getCompany() != null ? meeting.getCompany().getId() : null)
                .companyName(meeting.getCompany() != null ? meeting.getCompany().getName() : null)
                .title(meeting.getTitle())
                .description(meeting.getDescription())
                .meetingDate(meeting.getMeetingDate())
                .durationMinutes(meeting.getDurationMinutes())
                .location(meeting.getLocation())
                .status(meeting.getStatus().name())
                .createdById(meeting.getCreatedBy().getId())
                .createdByName(meeting.getCreatedBy().getPerson() != null
                        ? meeting.getCreatedBy().getPerson().getFullName()
                        : meeting.getCreatedBy().getEmail())
                .participants(participants.stream().map(p -> MeetingResponse.ParticipantInfo.builder()
                        .userId(p.getUser().getId())
                        .fullName(p.getUser().getPerson() != null ? p.getUser().getPerson().getFullName() : p.getUser().getEmail())
                        .email(p.getUser().getEmail())
                        .noteSubmitted(noteUserIds.contains(p.getUser().getId()))
                        .build()).toList())
                .notes(notes.stream().map(n -> MeetingResponse.NoteInfo.builder()
                        .userId(n.getUser().getId())
                        .fullName(n.getUser().getPerson() != null ? n.getUser().getPerson().getFullName() : n.getUser().getEmail())
                        .content(n.getContent())
                        .createdAt(n.getCreatedAt())
                        .build()).toList())
                .createdAt(meeting.getCreatedAt())
                .build();
    }
}
