package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.ApprovalRequestResponse;
import com.fogistanbul.crm.entity.ApprovalRequest;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.RequestStatus;
import com.fogistanbul.crm.entity.enums.RequestType;
import com.fogistanbul.crm.repository.ApprovalRequestRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApprovalRequestService {

    private final ApprovalRequestRepository repo;
    private final CompanyRepository companyRepo;
    private final UserProfileRepository userProfileRepo;
    private final ContentPlanService contentPlanService;

    @Transactional
    public ApprovalRequestResponse create(RequestType type, UUID referenceId, UUID companyId,
                                          UUID requestedById, String title, String description, String metadata) {
        Company company = companyRepo.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Şirket bulunamadı"));
        UserProfile user = userProfileRepo.findById(requestedById)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        ApprovalRequest req = ApprovalRequest.builder()
                .type(type)
                .referenceId(referenceId)
                .company(company)
                .requestedBy(user)
                .status(RequestStatus.PENDING)
                .title(title)
                .description(description)
                .metadata(metadata)
                .build();

        return toResponse(repo.save(req));
    }

    @Transactional(readOnly = true)
    public List<ApprovalRequestResponse> getPending() {
        return repo.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ApprovalRequestResponse> getAll() {
        return repo.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long countPending() {
        return repo.countByStatus(RequestStatus.PENDING);
    }

    @Transactional
    public ApprovalRequestResponse approve(UUID id, UUID reviewerId, String note, Map<String, Object> shootData) {
        ApprovalRequest req = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("İstek bulunamadı"));
        UserProfile reviewer = userProfileRepo.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        req.setStatus(RequestStatus.APPROVED);
        req.setReviewedBy(reviewer);
        req.setReviewNote(note);
        req.setReviewedAt(LocalDateTime.now());

        // Execute the action based on type
        if (req.getType() == RequestType.CONTENT_APPROVAL && req.getMetadata() != null) {
            executeContentApproval(req, reviewerId, shootData);
        }

        return toResponse(repo.save(req));
    }

    @Transactional
    public ApprovalRequestResponse reject(UUID id, UUID reviewerId, String note) {
        ApprovalRequest req = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("İstek bulunamadı"));
        UserProfile reviewer = userProfileRepo.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        req.setStatus(RequestStatus.REJECTED);
        req.setReviewedBy(reviewer);
        req.setReviewNote(note);
        req.setReviewedAt(LocalDateTime.now());

        return toResponse(repo.save(req));
    }

    private void executeContentApproval(ApprovalRequest req, UUID reviewerId, Map<String, Object> shootData) {
        try {
            // Parse metadata to extract shoot parameters
            // Metadata format: shootTitle||shootDescription||shootDate||shootTime||location||existingShootId
            String[] parts = req.getMetadata().split("\\|\\|", -1);
            String shootTitle = parts.length > 0 ? nullIfEmpty(parts[0]) : null;
            String shootDescription = parts.length > 1 ? nullIfEmpty(parts[1]) : null;
            String shootDate = parts.length > 2 ? nullIfEmpty(parts[2]) : null;
            String shootTime = parts.length > 3 ? nullIfEmpty(parts[3]) : null;
            String location = parts.length > 4 ? nullIfEmpty(parts[4]) : null;
            String existingShootId = parts.length > 5 ? nullIfEmpty(parts[5]) : null;

            // Admin overrides from the approval form
            if (shootData != null) {
                if (shootData.containsKey("shootTitle")) shootTitle = nullIfEmpty((String) shootData.get("shootTitle"));
                if (shootData.containsKey("shootDescription")) shootDescription = nullIfEmpty((String) shootData.get("shootDescription"));
                if (shootData.containsKey("shootDate")) shootDate = nullIfEmpty((String) shootData.get("shootDate"));
                if (shootData.containsKey("shootTime")) shootTime = nullIfEmpty((String) shootData.get("shootTime"));
                if (shootData.containsKey("location")) location = nullIfEmpty((String) shootData.get("location"));
                if (shootData.containsKey("existingShootId")) existingShootId = nullIfEmpty((String) shootData.get("existingShootId"));
            }

            UUID photographerId = null;
            String notes = null;
            java.util.List<com.fogistanbul.crm.dto.CreateShootRequest.EquipmentRequest> equipmentList = null;
            if (shootData != null) {
                if (shootData.get("photographerId") != null) {
                    photographerId = UUID.fromString((String) shootData.get("photographerId"));
                }
                notes = nullIfEmpty((String) shootData.get("notes"));
                if (shootData.get("equipment") instanceof List<?> eqRaw) {
                    equipmentList = new java.util.ArrayList<>();
                    for (Object item : eqRaw) {
                        if (item instanceof Map<?, ?> eqMap) {
                            var eqReq = new com.fogistanbul.crm.dto.CreateShootRequest.EquipmentRequest();
                            eqReq.setName((String) eqMap.get("name"));
                            if (eqMap.get("quantity") instanceof Number n) eqReq.setQuantity(n.intValue());
                            eqReq.setNotes((String) eqMap.get("notes"));
                            equipmentList.add(eqReq);
                        }
                    }
                }
            }

            if (existingShootId != null) {
                contentPlanService.approveWithExistingShoot(
                        req.getReferenceId(),
                        req.getCompany().getId(),
                        UUID.fromString(existingShootId)
                );
            } else if (shootTitle != null) {
                contentPlanService.approveWithShoot(
                        req.getReferenceId(),
                        reviewerId,
                        req.getCompany().getId(),
                        shootTitle,
                        shootDescription,
                        shootDate,
                        shootTime,
                        location,
                        photographerId,
                        notes,
                        equipmentList
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("İçerik onay işlemi başarısız: " + e.getMessage(), e);
        }
    }

    private String nullIfEmpty(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private ApprovalRequestResponse toResponse(ApprovalRequest req) {
        String requestedByName = req.getRequestedBy().getPerson() != null
                ? req.getRequestedBy().getPerson().getFullName()
                : req.getRequestedBy().getEmail();

        String reviewedByName = null;
        if (req.getReviewedBy() != null) {
            reviewedByName = req.getReviewedBy().getPerson() != null
                    ? req.getReviewedBy().getPerson().getFullName()
                    : req.getReviewedBy().getEmail();
        }

        return ApprovalRequestResponse.builder()
                .id(req.getId())
                .type(req.getType().name())
                .referenceId(req.getReferenceId())
                .companyName(req.getCompany().getName())
                .companyId(req.getCompany().getId())
                .requestedByName(requestedByName)
                .requestedById(req.getRequestedBy().getId())
                .status(req.getStatus().name())
                .title(req.getTitle())
                .description(req.getDescription())
                .metadata(req.getMetadata())
                .reviewedByName(reviewedByName)
                .reviewNote(req.getReviewNote())
                .createdAt(req.getCreatedAt())
                .reviewedAt(req.getReviewedAt())
                .build();
    }
}
