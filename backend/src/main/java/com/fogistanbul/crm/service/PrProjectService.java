package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.CreatePrProjectRequest;
import com.fogistanbul.crm.dto.PrProjectResponse;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.PrProject;
import com.fogistanbul.crm.entity.PrProjectMember;
import com.fogistanbul.crm.entity.PrProjectPhase;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.PrProjectStatus;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.PrProjectMemberRepository;
import com.fogistanbul.crm.repository.PrProjectPhaseRepository;
import com.fogistanbul.crm.repository.PrProjectRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrProjectService {

    private final PrProjectRepository projectRepository;
    private final PrProjectPhaseRepository phaseRepository;
    private final PrProjectMemberRepository memberRepository;
    private final CompanyRepository companyRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional
    public PrProjectResponse createProject(CreatePrProjectRequest req, UUID createdById) {
        Company company = companyRepository.findById(req.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
        UserProfile creator = getUserOrThrow(createdById);
        ensureCompanyAccess(creator, company.getId());

        int totalPhases = req.getTotalPhases() != null ? req.getTotalPhases() :
                (req.getPhaseNames() != null ? req.getPhaseNames().size() : 1);

        PrProject project = PrProject.builder()
                .company(company)
                .name(req.getName())
                .purpose(req.getPurpose())
                .totalPhases(totalPhases)
                .createdBy(creator)
                .build();
        project = projectRepository.save(project);

        if (req.getPhaseNames() != null) {
            for (int i = 0; i < req.getPhaseNames().size(); i++) {
                phaseRepository.save(PrProjectPhase.builder()
                        .project(project)
                        .phaseNumber(i + 1)
                        .name(req.getPhaseNames().get(i))
                        .build());
            }
        } else {
            for (int i = 1; i <= totalPhases; i++) {
                phaseRepository.save(PrProjectPhase.builder()
                        .project(project)
                        .phaseNumber(i)
                        .name("Faz " + i)
                        .build());
            }
        }

        if (req.getMemberIds() != null) {
            for (UUID memberId : req.getMemberIds()) {
                UserProfile member = userProfileRepository.findById(memberId).orElse(null);
                if (member != null) {
                    ensureCompanyAccess(member, company.getId());
                    memberRepository.save(PrProjectMember.builder()
                            .project(project)
                            .user(member)
                            .build());
                }
            }
        }

        log.info("PR Project created: {} for company {}", project.getName(), company.getName());
        return toResponse(project);
    }

    @Transactional(readOnly = true)
    public Page<PrProjectResponse> getAllProjects(Pageable pageable, UUID userId) {
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return projectRepository.findAll(pageable).map(this::toResponse);
        }

        List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        if (companyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return projectRepository.findByCompanyIdIn(companyIds, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<PrProjectResponse> getProjectsByCompany(UUID companyId, Pageable pageable, UUID userId) {
        ensureCompanyAccess(getUserOrThrow(userId), companyId);
        return projectRepository.findByCompanyId(companyId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PrProjectResponse getProjectById(UUID projectId, UUID userId) {
        PrProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("PR Projesi bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), project.getCompany().getId());
        return toResponse(project);
    }

    @Transactional
    public PrProjectResponse completePhase(UUID projectId, UUID phaseId, UUID userId) {
        PrProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("PR Projesi bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), project.getCompany().getId());

        PrProjectPhase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new RuntimeException("Faz bulunamadi"));
        if (!phase.getProject().getId().equals(projectId)) {
            throw new RuntimeException("Faz bu projeye ait degil");
        }

        phase.setIsCompleted(true);
        phase.setCompletedAt(Instant.now());
        phaseRepository.save(phase);

        List<PrProjectPhase> phases = phaseRepository.findByProjectIdOrderByPhaseNumber(projectId);
        long completedCount = phases.stream().filter(PrProjectPhase::getIsCompleted).count();
        BigDecimal progress = BigDecimal.valueOf(completedCount)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(phases.size()), 2, RoundingMode.HALF_UP);
        project.setProgressPercent(progress);

        int nextPhase = phases.stream()
                .filter(p -> !p.getIsCompleted())
                .mapToInt(PrProjectPhase::getPhaseNumber)
                .min()
                .orElse(project.getTotalPhases());
        project.setCurrentPhase(nextPhase);

        if (completedCount == phases.size()) {
            project.setStatus(PrProjectStatus.COMPLETED);
        }

        projectRepository.save(project);
        return toResponse(project);
    }

    @Transactional
    public void deleteProject(UUID projectId, UUID userId) {
        PrProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("PR Projesi bulunamadi"));
        ensureCompanyAccess(getUserOrThrow(userId), project.getCompany().getId());
        projectRepository.delete(project);
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

    private PrProjectResponse toResponse(PrProject project) {
        List<PrProjectPhase> phases = phaseRepository.findByProjectIdOrderByPhaseNumber(project.getId());
        List<PrProjectMember> members = memberRepository.findByProjectId(project.getId());

        return PrProjectResponse.builder()
                .id(project.getId())
                .companyId(project.getCompany().getId())
                .companyName(project.getCompany().getName())
                .name(project.getName())
                .purpose(project.getPurpose())
                .totalPhases(project.getTotalPhases())
                .currentPhase(project.getCurrentPhase())
                .progressPercent(project.getProgressPercent())
                .status(project.getStatus().name())
                .createdById(project.getCreatedBy().getId())
                .createdByName(project.getCreatedBy().getPerson() != null
                        ? project.getCreatedBy().getPerson().getFullName()
                        : project.getCreatedBy().getEmail())
                .phases(phases.stream().map(p -> PrProjectResponse.PhaseInfo.builder()
                        .id(p.getId())
                        .phaseNumber(p.getPhaseNumber())
                        .name(p.getName())
                        .isCompleted(p.getIsCompleted())
                        .completedAt(p.getCompletedAt())
                        .build()).toList())
                .members(members.stream().map(m -> PrProjectResponse.MemberInfo.builder()
                        .userId(m.getUser().getId())
                        .fullName(m.getUser().getPerson() != null ? m.getUser().getPerson().getFullName() : m.getUser().getEmail())
                        .build()).toList())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
