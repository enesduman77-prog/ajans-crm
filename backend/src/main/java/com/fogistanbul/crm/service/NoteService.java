package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.CreateNoteRequest;
import com.fogistanbul.crm.dto.NoteResponse;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.Note;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.NoteRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyRepository companyRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional
    public NoteResponse createNote(CreateNoteRequest req, UUID userId) {
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));

        Note note = Note.builder()
                .user(user)
                .content(req.getContent())
                .build();

        if (req.getCompanyId() != null) {
            ensureCompanyAccess(user, req.getCompanyId());
            Company company = companyRepository.findById(req.getCompanyId())
                    .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
            note.setCompany(company);
        }

        note = noteRepository.save(note);
        log.info("Note created by user {}", user.getEmail());
        return toResponse(note);
    }

    @Transactional(readOnly = true)
    public Page<NoteResponse> getMyNotes(UUID userId, Pageable pageable) {
        return noteRepository.findByUserId(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<NoteResponse> getMyNotesByCompany(UUID userId, UUID companyId, Pageable pageable) {
        return noteRepository.findByUserIdAndCompanyId(userId, companyId, pageable).map(this::toResponse);
    }

    @Transactional
    public NoteResponse toggleNote(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Not bulunamadi"));
        if (!note.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bu notu degistirme yetkiniz yok");
        }
        note.setIsOpen(!note.getIsOpen());
        note = noteRepository.save(note);
        return toResponse(note);
    }

    @Transactional
    public void deleteNote(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Not bulunamadi"));
        if (!note.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bu notu silme yetkiniz yok");
        }
        noteRepository.delete(note);
    }

    private void ensureCompanyAccess(UserProfile user, UUID companyId) {
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return;
        }
        if (!membershipRepository.existsByUserIdAndCompanyId(user.getId(), companyId)) {
            throw new RuntimeException("Bu sirketle not baglama yetkiniz yok");
        }
    }

    private NoteResponse toResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .userId(note.getUser().getId())
                .userName(note.getUser().getPerson() != null
                        ? note.getUser().getPerson().getFullName()
                        : note.getUser().getEmail())
                .companyId(note.getCompany() != null ? note.getCompany().getId() : null)
                .companyName(note.getCompany() != null ? note.getCompany().getName() : null)
                .content(note.getContent())
                .isOpen(note.getIsOpen())
                .noteDate(note.getNoteDate())
                .createdAt(note.getCreatedAt())
                .build();
    }
}