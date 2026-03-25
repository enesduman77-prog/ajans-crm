package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.CreateNoteRequest;
import com.fogistanbul.crm.dto.NoteResponse;
import com.fogistanbul.crm.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/staff/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @PostMapping
    public ResponseEntity<NoteResponse> create(
            @Valid @RequestBody CreateNoteRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(noteService.createNote(request, userId));
    }

    @GetMapping
    public Page<NoteResponse> getMyNotes(
            @RequestParam(required = false) UUID companyId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        if (companyId != null) {
            return noteService.getMyNotesByCompany(userId, companyId, pageable);
        }
        return noteService.getMyNotes(userId, pageable);
    }

    @PutMapping("/{id}/toggle")
    public NoteResponse toggle(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return noteService.toggleNote(id, userId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        noteService.deleteNote(id, userId);
        return ResponseEntity.noContent().build();
    }
}
