package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.MaintenanceLogRequest;
import com.fogistanbul.crm.dto.MaintenanceLogResponse;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.MaintenanceLogEntry;
import com.fogistanbul.crm.entity.Person;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.MaintenanceLogEntryRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MaintenanceLogService {

    private final MaintenanceLogEntryRepository repository;
    private final CompanyRepository companyRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional(readOnly = true)
    public List<MaintenanceLogResponse> listForCompany(UUID companyId, UUID userId, String role) {
        ensureReadAccess(companyId, userId, role);
        return repository.findByCompanyIdOrderByPerformedAtDesc(companyId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MaintenanceLogResponse create(UUID companyId, MaintenanceLogRequest req, UUID userId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
        UserProfile author = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));

        MaintenanceLogEntry entry = MaintenanceLogEntry.builder()
                .company(company)
                .title(req.getTitle())
                .description(req.getDescription())
                .category(req.getCategory())
                .performedAt(req.getPerformedAt())
                .performedBy(author)
                .build();
        return toResponse(repository.save(entry));
    }

    @Transactional
    public MaintenanceLogResponse update(UUID id, MaintenanceLogRequest req) {
        MaintenanceLogEntry entry = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bakim kaydi bulunamadi"));
        entry.setTitle(req.getTitle());
        entry.setDescription(req.getDescription());
        entry.setCategory(req.getCategory());
        entry.setPerformedAt(req.getPerformedAt());
        return toResponse(repository.save(entry));
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    private void ensureReadAccess(UUID companyId, UUID userId, String role) {
        if ("ROLE_ADMIN".equals(role) || "ROLE_AGENCY_STAFF".equals(role)) {
            return;
        }
        if (!membershipRepository.existsByUserIdAndCompanyId(userId, companyId)) {
            throw new RuntimeException("Bu sirkete erisim yetkiniz yok");
        }
    }

    private MaintenanceLogResponse toResponse(MaintenanceLogEntry e) {
        UserProfile by = e.getPerformedBy();
        String name = null;
        if (by != null) {
            Person p = by.getPerson();
            name = p != null && p.getFullName() != null ? p.getFullName() : by.getEmail();
        }
        return MaintenanceLogResponse.builder()
                .id(e.getId().toString())
                .companyId(e.getCompany().getId().toString())
                .title(e.getTitle())
                .description(e.getDescription())
                .category(e.getCategory())
                .performedAt(e.getPerformedAt())
                .performedById(by != null ? by.getId().toString() : null)
                .performedByName(name)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
