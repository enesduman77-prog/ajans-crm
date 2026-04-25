package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.ContentPlanResponse;
import com.fogistanbul.crm.dto.CreateContentPlanRequest;
import com.fogistanbul.crm.dto.UpdateContentPlanRequest;
import com.fogistanbul.crm.dto.CreateShootRequest;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.ContentPlan;
import com.fogistanbul.crm.entity.Shoot;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.ContentPlatform;
import com.fogistanbul.crm.entity.enums.ContentStatus;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.ContentPlanRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContentPlanService {

    private final ContentPlanRepository contentPlanRepo;
    private final CompanyRepository companyRepo;
    private final UserProfileRepository userProfileRepo;
    private final ShootService shootService;

    @Transactional
    public ContentPlanResponse create(CreateContentPlanRequest req, UUID createdById) {
        Company company = companyRepo.findById(req.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Şirket bulunamadı: " + req.getCompanyId()));
        UserProfile creator = userProfileRepo.findById(createdById)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + createdById));

        ContentPlan plan = ContentPlan.builder()
                .company(company)
                .createdBy(creator)
                .title(req.getTitle())
                .description(req.getDescription())
                .authorName(req.getAuthorName())
                .platform(ContentPlatform.valueOf(req.getPlatform()))
                .contentSize(req.getContentSize())
                .direction(req.getDirection())
                .speakerModel(req.getSpeakerModel())
                .status(ContentStatus.DRAFT)
                .plannedDate(req.getPlannedDate() != null ? LocalDate.parse(req.getPlannedDate()) : null)
                .build();

        plan = contentPlanRepo.save(plan);
        return toResponse(plan);
    }

    @Transactional
    public ContentPlanResponse update(UUID id, UpdateContentPlanRequest req) {
        ContentPlan plan = contentPlanRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("İçerik planı bulunamadı: " + id));

        if (req.getTitle() != null) plan.setTitle(req.getTitle());
        if (req.getDescription() != null) plan.setDescription(req.getDescription());
        if (req.getAuthorName() != null) plan.setAuthorName(req.getAuthorName());
        if (req.getPlatform() != null) plan.setPlatform(ContentPlatform.valueOf(req.getPlatform()));
        if (req.getContentSize() != null) plan.setContentSize(req.getContentSize());
        if (req.getDirection() != null) plan.setDirection(req.getDirection());
        if (req.getSpeakerModel() != null) plan.setSpeakerModel(req.getSpeakerModel());
        if (req.getStatus() != null) plan.setStatus(ContentStatus.valueOf(req.getStatus()));
        if (req.getRevisionNote() != null) plan.setRevisionNote(req.getRevisionNote());
        if (req.getPlannedDate() != null) plan.setPlannedDate(LocalDate.parse(req.getPlannedDate()));

        plan = contentPlanRepo.save(plan);
        return toResponse(plan);
    }

    @Transactional(readOnly = true)
    public Page<ContentPlanResponse> getByCompany(UUID companyId, String status, int page, int size) {
        Page<ContentPlan> plans;
        if (status != null && !status.isBlank()) {
            plans = contentPlanRepo.findByCompanyIdAndStatusOrderByCreatedAtDesc(
                    companyId, ContentStatus.valueOf(status), PageRequest.of(page, size));
        } else {
            plans = contentPlanRepo.findByCompanyIdOrderByCreatedAtDesc(companyId, PageRequest.of(page, size));
        }
        return plans.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ContentPlanResponse> getAll(int page, int size) {
        return contentPlanRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ContentPlanResponse getById(UUID id) {
        ContentPlan plan = contentPlanRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("İçerik planı bulunamadı: " + id));
        return toResponse(plan);
    }

    @Transactional(readOnly = true)
    public java.util.List<ContentPlanResponse> getByShoot(UUID shootId) {
        return contentPlanRepo.findByShootId(shootId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ContentPlanResponse approveWithExistingShoot(UUID contentPlanId, UUID companyId, UUID shootId) {
        ContentPlan plan = contentPlanRepo.findById(contentPlanId)
                .orElseThrow(() -> new RuntimeException("İçerik planı bulunamadı: " + contentPlanId));

        if (!plan.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("Bu içerik planı size ait değil");
        }

        Shoot shoot = shootService.getShootEntity(shootId);
        plan.setShoot(shoot);
        plan.setStatus(ContentStatus.APPROVED);
        plan = contentPlanRepo.save(plan);
        return toResponse(plan);
    }

    @Transactional
    public void delete(UUID id) {
        contentPlanRepo.deleteById(id);
    }

    @Transactional
    public ContentPlanResponse approveWithShoot(UUID contentPlanId, UUID userId, UUID companyId, String shootTitle, String shootDescription, String shootDateStr, String shootTimeStr, String location) {
        return approveWithShoot(contentPlanId, userId, companyId, shootTitle, shootDescription, shootDateStr, shootTimeStr, location, null, null, null);
    }

    @Transactional
    public ContentPlanResponse approveWithShoot(UUID contentPlanId, UUID userId, UUID companyId,
                                                 String shootTitle, String shootDescription,
                                                 String shootDateStr, String shootTimeStr, String location,
                                                 UUID photographerId, String notes,
                                                 java.util.List<CreateShootRequest.EquipmentRequest> equipment) {
        ContentPlan plan = contentPlanRepo.findById(contentPlanId)
                .orElseThrow(() -> new RuntimeException("İçerik planı bulunamadı: " + contentPlanId));

        if (!plan.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("Bu içerik planı size ait değil");
        }

        Instant shootDate = null;
        if (shootDateStr != null && !shootDateStr.isBlank()) {
            shootDate = LocalDate.parse(shootDateStr).atStartOfDay().toInstant(java.time.ZoneOffset.UTC);
        }

        LocalTime shootTime = null;
        if (shootTimeStr != null && !shootTimeStr.isBlank()) {
            shootTime = LocalTime.parse(shootTimeStr);
        }

        CreateShootRequest shootReq = new CreateShootRequest();
        shootReq.setCompanyId(companyId);
        shootReq.setTitle(shootTitle);
        shootReq.setDescription(shootDescription);
        shootReq.setShootDate(shootDate);
        shootReq.setShootTime(shootTime);
        shootReq.setLocation(location);
        shootReq.setPhotographerId(photographerId);
        shootReq.setNotes(notes);
        shootReq.setEquipment(equipment);

        Shoot shoot = shootService.createShootForContentPlan(shootReq, userId);

        plan.setShoot(shoot);
        plan.setStatus(ContentStatus.APPROVED);
        plan = contentPlanRepo.save(plan);

        return toResponse(plan);
    }

    private ContentPlanResponse toResponse(ContentPlan p) {
        String creatorName = "";
        try {
            if (p.getCreatedBy() != null && p.getCreatedBy().getPerson() != null) {
                creatorName = p.getCreatedBy().getPerson().getFullName();
            }
        } catch (Exception ignored) {}

        String companyName = "";
        try {
            if (p.getCompany() != null) {
                companyName = p.getCompany().getName();
            }
        } catch (Exception ignored) {}

        return ContentPlanResponse.builder()
                .id(p.getId().toString())
                .companyId(p.getCompany().getId().toString())
                .companyName(companyName)
                .createdById(p.getCreatedBy().getId().toString())
                .createdByName(creatorName)
                .title(p.getTitle())
                .description(p.getDescription())
                .authorName(p.getAuthorName())
                .platform(p.getPlatform().name())
                .contentSize(p.getContentSize())
                .direction(p.getDirection())
                .speakerModel(p.getSpeakerModel())
                .status(p.getStatus().name())
                .revisionNote(p.getRevisionNote())
                .plannedDate(p.getPlannedDate() != null ? p.getPlannedDate().toString() : null)
                .shootId(p.getShoot() != null ? p.getShoot().getId().toString() : null)
                .shootDate(p.getShoot() != null && p.getShoot().getShootDate() != null ? p.getShoot().getShootDate().toString() : null)
                .shootTitle(p.getShoot() != null ? p.getShoot().getTitle() : null)
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null)
                .updatedAt(p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null)
                .build();
    }
}
