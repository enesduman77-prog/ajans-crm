package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.CreateStaffRequest;
import com.fogistanbul.crm.dto.StaffResponse;
import com.fogistanbul.crm.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/staff")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @PostMapping
    public ResponseEntity<StaffResponse> create(@Valid @RequestBody CreateStaffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(staffService.createStaff(request));
    }

    @GetMapping
    public ResponseEntity<List<StaffResponse>> getAll() {
        return ResponseEntity.ok(staffService.getAllStaff());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(staffService.getStaffById(id));
    }

    @PostMapping("/{staffId}/assign/{companyId}")
    public ResponseEntity<Map<String, String>> assign(@PathVariable UUID staffId, @PathVariable UUID companyId) {
        staffService.assignToCompany(staffId, companyId);
        return ResponseEntity.ok(Map.of("message", "Çalışan şirkete başarıyla atandı"));
    }

    @DeleteMapping("/membership/{membershipId}")
    public ResponseEntity<Void> unassign(@PathVariable UUID membershipId) {
        staffService.unassignFromCompany(membershipId);
        return ResponseEntity.noContent().build();
    }
}
