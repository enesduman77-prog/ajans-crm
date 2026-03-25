package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.CreateShootRequest;
import com.fogistanbul.crm.dto.ShootResponse;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.Shoot;
import com.fogistanbul.crm.entity.ShootParticipant;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.ShootStatus;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.ShootParticipantRepository;
import com.fogistanbul.crm.repository.ShootRepository;
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
public class ShootService {

    private final ShootRepository shootRepository;
    private final ShootParticipantRepository participantRepository;
    private final CompanyRepository companyRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional
    public ShootResponse createShoot(CreateShootRequest req, UUID createdById) {
        Company company = companyRepository.findById(req.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
        UserProfile creator = getUserOrThrow(createdById);
        ensureCompanyAccess(creator, company.getId());

        Shoot shoot = Shoot.builder()
                .company(company)
                .title(req.getTitle())
                .description(req.getDescription())
                .shootDate(req.getShootDate())
                .shootTime(req.getShootTime())
                .location(req.getLocation())
                .createdBy(creator)
                .build();
        shoot = shootRepository.save(shoot);

        if (req.getParticipants() != null) {
            for (CreateShootRequest.ShootParticipantRequest pr : req.getParticipants()) {
                UserProfile user = userProfileRepository.findById(pr.getUserId()).orElse(null);
                if (user != null) {
                    ensureCompanyAccess(user, company.getId());
                    participantRepository.save(ShootParticipant.builder()
                            .shoot(shoot)
                            .user(user)
                            .roleInShoot(pr.getRoleInShoot())
                            .build());
                }
            }
        }

        log.info("Shoot created: {} for company {}", shoot.getTitle(), company.getName());
        return toResponse(shoot);
    }

    @Transactional(readOnly = true)
    public Page<ShootResponse> getAllShoots(Pageable pageable, UUID userId) {
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return shootRepository.findAll(pageable).map(this::toResponse);
        }

        List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        if (companyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return shootRepository.findByCompanyIdIn(companyIds, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ShootResponse> getShootsByCompany(UUID companyId, Pageable pageable, UUID userId) {
        ensureCompanyAccess(getUserOrThrow(userId), companyId);
        return shootRepository.findByCompanyId(companyId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ShootResponse getShootById(UUID shootId, UUID userId) {
        Shoot shoot = shootRepository.findById(shootId)
                .orElseThrow(() -> new RuntimeException("Cekim bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), shoot.getCompany().getId());
        return toResponse(shoot);
    }

    @Transactional
    public ShootResponse updateStatus(UUID shootId, String status, UUID userId, String role) {
        Shoot shoot = shootRepository.findById(shootId)
                .orElseThrow(() -> new RuntimeException("Cekim bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), shoot.getCompany().getId());
        if (!"ROLE_ADMIN".equals(role) && !shoot.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Bu cekimi guncelleme yetkiniz yok");
        }
        shoot.setStatus(ShootStatus.valueOf(status));
        shoot = shootRepository.save(shoot);
        return toResponse(shoot);
    }

    @Transactional
    public void deleteShoot(UUID shootId, UUID userId, String role) {
        Shoot shoot = shootRepository.findById(shootId)
                .orElseThrow(() -> new RuntimeException("Cekim bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), shoot.getCompany().getId());
        if (!"ROLE_ADMIN".equals(role) && !shoot.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Bu cekimi silme yetkiniz yok");
        }
        shootRepository.delete(shoot);
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

    private ShootResponse toResponse(Shoot shoot) {
        var participants = participantRepository.findByShootId(shoot.getId());
        return ShootResponse.builder()
                .id(shoot.getId())
                .companyId(shoot.getCompany().getId())
                .companyName(shoot.getCompany().getName())
                .title(shoot.getTitle())
                .description(shoot.getDescription())
                .shootDate(shoot.getShootDate())
                .shootTime(shoot.getShootTime())
                .location(shoot.getLocation())
                .status(shoot.getStatus().name())
                .createdById(shoot.getCreatedBy().getId())
                .createdByName(shoot.getCreatedBy().getPerson() != null
                        ? shoot.getCreatedBy().getPerson().getFullName()
                        : shoot.getCreatedBy().getEmail())
                .participants(participants.stream().map(p -> ShootResponse.ParticipantInfo.builder()
                        .userId(p.getUser().getId())
                        .fullName(p.getUser().getPerson() != null ? p.getUser().getPerson().getFullName() : p.getUser().getEmail())
                        .roleInShoot(p.getRoleInShoot())
                        .build()).toList())
                .createdAt(shoot.getCreatedAt())
                .build();
    }
}
