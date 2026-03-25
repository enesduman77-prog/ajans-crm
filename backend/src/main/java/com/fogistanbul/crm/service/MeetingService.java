package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.CreateMeetingRequest;
import com.fogistanbul.crm.dto.MeetingResponse;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.Meeting;
import com.fogistanbul.crm.entity.MeetingParticipant;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.MeetingStatus;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
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
    private final CompanyRepository companyRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional
    public MeetingResponse createMeeting(CreateMeetingRequest req, UUID createdById) {
        Company company = companyRepository.findById(req.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
        UserProfile creator = getUserOrThrow(createdById);
        ensureCompanyAccess(creator, company.getId());

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
                    ensureCompanyAccess(participant, company.getId());
                    participantRepository.save(MeetingParticipant.builder()
                            .meeting(meeting)
                            .user(participant)
                            .build());
                }
            }
        }

        log.info("Meeting created: {} for company {}", meeting.getTitle(), company.getName());
        return toResponse(meeting);
    }

    @Transactional(readOnly = true)
    public Page<MeetingResponse> getAllMeetings(Pageable pageable, UUID userId) {
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
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
        ensureCompanyAccess(getUserOrThrow(userId), meeting.getCompany().getId());
        return toResponse(meeting);
    }

    @Transactional
    public MeetingResponse updateStatus(UUID meetingId, String status, UUID userId, String role) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Toplanti bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), meeting.getCompany().getId());
        if (!"ROLE_ADMIN".equals(role) && !meeting.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Bu toplantiyi guncelleme yetkiniz yok");
        }
        meeting.setStatus(MeetingStatus.valueOf(status));
        meeting = meetingRepository.save(meeting);
        return toResponse(meeting);
    }

    @Transactional
    public void deleteMeeting(UUID meetingId, UUID userId, String role) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Toplanti bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), meeting.getCompany().getId());
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
        return MeetingResponse.builder()
                .id(meeting.getId())
                .companyId(meeting.getCompany().getId())
                .companyName(meeting.getCompany().getName())
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
                        .build()).toList())
                .createdAt(meeting.getCreatedAt())
                .build();
    }
}
