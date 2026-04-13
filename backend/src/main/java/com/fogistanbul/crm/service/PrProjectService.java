package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.CreatePrProjectRequest;
import com.fogistanbul.crm.dto.PrProjectResponse;
import com.fogistanbul.crm.dto.UpdatePrProjectRequest;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.PrProject;
import com.fogistanbul.crm.entity.PrProjectMember;
import com.fogistanbul.crm.entity.PrPhaseNote;
import com.fogistanbul.crm.entity.PrProjectPhase;
import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.PrProjectStatus;
import com.fogistanbul.crm.entity.enums.TaskCategory;
import com.fogistanbul.crm.entity.enums.Priority;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.PrPhaseNoteRepository;
import com.fogistanbul.crm.repository.PrProjectMemberRepository;
import com.fogistanbul.crm.repository.PrProjectPhaseRepository;
import com.fogistanbul.crm.repository.PrProjectRepository;
import com.fogistanbul.crm.repository.TaskRepository;
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
    private final PrPhaseNoteRepository phaseNoteRepository;
    private final CompanyMembershipRepository membershipRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public PrProjectResponse createProject(CreatePrProjectRequest req, UUID createdById) {
        Company company = null;
        if (req.getCompanyId() != null) {
            company = companyRepository.findById(req.getCompanyId())
                    .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
            ensureCompanyAccess(getUserOrThrow(createdById), company.getId());
        }
        UserProfile creator = getUserOrThrow(createdById);

        UserProfile responsible = null;
        if (req.getResponsibleId() != null) {
            responsible = userProfileRepository.findById(req.getResponsibleId()).orElse(null);
        }

        int totalPhases = 0;
        if (req.getPhases() != null) {
            totalPhases = req.getPhases().size();
        } else if (req.getTotalPhases() != null) {
            totalPhases = req.getTotalPhases();
        }

        PrProject project = PrProject.builder()
                .company(company)
                .name(req.getName())
                .purpose(req.getPurpose())
                .totalPhases(totalPhases)
                .responsible(responsible)
                .startDate(parseInstant(req.getStartDate()))
                .endDate(parseInstant(req.getEndDate()))
                .notes(req.getNotes())
                .createdBy(creator)
                .build();
        project = projectRepository.save(project);

        if (req.getPhases() != null && !req.getPhases().isEmpty()) {
            for (int i = 0; i < req.getPhases().size(); i++) {
                CreatePrProjectRequest.PhaseRequest pr = req.getPhases().get(i);
                UserProfile assignedTo = null;
                if (pr.getAssignedToId() != null) {
                    assignedTo = userProfileRepository.findById(pr.getAssignedToId()).orElse(null);
                }

                String phaseName = pr.getName() != null ? pr.getName() : "Faz " + (i + 1);

                // Auto-create a task for this phase
                UserProfile taskAssignee = assignedTo != null ? assignedTo : (responsible != null ? responsible : creator);
                Task phaseTask = Task.builder()
                        .company(company)
                        .createdBy(creator)
                        .assignedTo(taskAssignee)
                        .title("[" + project.getName() + "] " + phaseName)
                        .description("Proje fazı: " + phaseName)
                        .category(TaskCategory.OTHER)
                        .startDate(parseInstant(pr.getStartDate()))
                        .endDate(parseInstant(pr.getEndDate()))
                        .build();
                phaseTask = taskRepository.save(phaseTask);

                phaseRepository.save(PrProjectPhase.builder()
                        .project(project)
                        .phaseNumber(i + 1)
                        .name(phaseName)
                        .assignedTo(assignedTo)
                        .startDate(parseInstant(pr.getStartDate()))
                        .endDate(parseInstant(pr.getEndDate()))
                        .notes(pr.getNotes())
                        .task(phaseTask)
                        .build());
            }
        }

        if (req.getMemberIds() != null) {
            for (UUID memberId : req.getMemberIds()) {
                UserProfile member = userProfileRepository.findById(memberId).orElse(null);
                if (member != null) {
                    memberRepository.save(PrProjectMember.builder()
                            .project(project)
                            .user(member)
                            .build());
                }
            }
        }

        log.info("PR Project created: {}", project.getName());
        return toResponse(project);
    }

    @Transactional(readOnly = true)
    public Page<PrProjectResponse> getAllProjects(Pageable pageable, UUID userId) {
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return projectRepository.findAll(pageable).map(this::toResponse);
        }

        List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        return projectRepository.findAccessibleProjects(companyIds, userId, pageable).map(this::toResponse);
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
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() != GlobalRole.ADMIN && project.getCompany() != null) {
            ensureCompanyAccess(user, project.getCompany().getId());
        }
        return toResponse(project);
    }

    @Transactional
    public PrProjectResponse completePhase(UUID projectId, UUID phaseId, UUID userId) {
        PrProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("PR Projesi bulunamadi"));
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() != GlobalRole.ADMIN && project.getCompany() != null) {
            ensureCompanyAccess(user, project.getCompany().getId());
        }

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
    public PrProjectResponse updateProject(UUID projectId, UpdatePrProjectRequest req, UUID userId) {
        PrProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("PR Projesi bulunamadi"));
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() != GlobalRole.ADMIN && project.getCompany() != null) {
            ensureCompanyAccess(user, project.getCompany().getId());
        }

        if (req.getName() != null) project.setName(req.getName());
        if (req.getPurpose() != null) project.setPurpose(req.getPurpose());
        if (req.getNotes() != null) project.setNotes(req.getNotes());
        if (req.getStartDate() != null) project.setStartDate(parseInstant(req.getStartDate()));
        if (req.getEndDate() != null) project.setEndDate(parseInstant(req.getEndDate()));

        if (req.getStatus() != null) {
            project.setStatus(PrProjectStatus.valueOf(req.getStatus()));
        }

        if (req.getCompanyId() != null) {
            Company company = companyRepository.findById(req.getCompanyId()).orElse(null);
            project.setCompany(company);
        }

        if (req.getResponsibleId() != null) {
            UserProfile responsible = userProfileRepository.findById(req.getResponsibleId()).orElse(null);
            project.setResponsible(responsible);
        }

        if (req.getPhases() != null) {
            for (UpdatePrProjectRequest.PhaseUpdateRequest pr : req.getPhases()) {
                if (pr.getId() != null) {
                    PrProjectPhase phase = phaseRepository.findById(pr.getId()).orElse(null);
                    if (phase != null && phase.getProject().getId().equals(projectId)) {
                        if (pr.getName() != null) phase.setName(pr.getName());
                        if (pr.getNotes() != null) phase.setNotes(pr.getNotes());
                        if (pr.getStartDate() != null) phase.setStartDate(parseInstant(pr.getStartDate()));
                        if (pr.getEndDate() != null) phase.setEndDate(parseInstant(pr.getEndDate()));
                        if (pr.getAssignedToId() != null) {
                            phase.setAssignedTo(userProfileRepository.findById(pr.getAssignedToId()).orElse(null));
                        }
                        phaseRepository.save(phase);
                    }
                } else {
                    // New phase
                    List<PrProjectPhase> existing = phaseRepository.findByProjectIdOrderByPhaseNumber(projectId);
                    int nextNum = existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getPhaseNumber() + 1;
                    UserProfile assignedTo = pr.getAssignedToId() != null
                            ? userProfileRepository.findById(pr.getAssignedToId()).orElse(null) : null;
                    String phaseName = pr.getName() != null ? pr.getName() : "Faz " + nextNum;

                    // Auto-create a task for this new phase
                    UserProfile taskAssignee = assignedTo != null ? assignedTo
                            : (project.getResponsible() != null ? project.getResponsible() : project.getCreatedBy());
                    Task phaseTask = Task.builder()
                            .company(project.getCompany())
                            .createdBy(project.getCreatedBy())
                            .assignedTo(taskAssignee)
                            .title("[" + project.getName() + "] " + phaseName)
                            .description("Proje fazı: " + phaseName)
                            .category(TaskCategory.OTHER)
                            .startDate(parseInstant(pr.getStartDate()))
                            .endDate(parseInstant(pr.getEndDate()))
                            .build();
                    phaseTask = taskRepository.save(phaseTask);

                    phaseRepository.save(PrProjectPhase.builder()
                            .project(project)
                            .phaseNumber(nextNum)
                            .name(phaseName)
                            .assignedTo(assignedTo)
                            .startDate(parseInstant(pr.getStartDate()))
                            .endDate(parseInstant(pr.getEndDate()))
                            .notes(pr.getNotes())
                            .task(phaseTask)
                            .build());
                    project.setTotalPhases(nextNum);
                }
            }
        }

        projectRepository.save(project);
        return toResponse(project);
    }

    @Transactional
    public void deleteProject(UUID projectId, UUID userId) {
        PrProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("PR Projesi bulunamadi"));
        UserProfile user = getUserOrThrow(userId);
        if (user.getGlobalRole() != GlobalRole.ADMIN && project.getCompany() != null) {
            ensureCompanyAccess(user, project.getCompany().getId());
        }
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

    @Transactional
    public PrProjectResponse addPhaseNote(UUID projectId, UUID phaseId, String content, UUID userId) {
        PrProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proje bulunamadi"));
        PrProjectPhase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new RuntimeException("Faz bulunamadi"));
        if (!phase.getProject().getId().equals(projectId)) {
            throw new RuntimeException("Faz bu projeye ait degil");
        }
        UserProfile author = getUserOrThrow(userId);
        if (project.getCompany() != null) {
            ensureCompanyAccess(author, project.getCompany().getId());
        }

        phaseNoteRepository.save(PrPhaseNote.builder()
                .phase(phase)
                .author(author)
                .content(content)
                .build());

        return toResponse(project);
    }

    private PrProjectResponse toResponse(PrProject project) {
        List<PrProjectPhase> phases = phaseRepository.findByProjectIdOrderByPhaseNumber(project.getId());
        List<PrProjectMember> members = memberRepository.findByProjectId(project.getId());
        List<PrPhaseNote> allNotes = phaseNoteRepository.findByPhaseProjectIdOrderByCreatedAtDesc(project.getId());

        String responsibleName = null;
        UUID responsibleId = null;
        if (project.getResponsible() != null) {
            responsibleId = project.getResponsible().getId();
            responsibleName = project.getResponsible().getPerson() != null
                    ? project.getResponsible().getPerson().getFullName()
                    : project.getResponsible().getEmail();
        }

        return PrProjectResponse.builder()
                .id(project.getId())
                .companyId(project.getCompany() != null ? project.getCompany().getId() : null)
                .companyName(project.getCompany() != null ? project.getCompany().getName() : null)
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
                .responsibleId(responsibleId)
                .responsibleName(responsibleName)
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .notes(project.getNotes())
                .phases(phases.stream().map(p -> {
                    String assignedToName = null;
                    UUID assignedToId = null;
                    if (p.getAssignedTo() != null) {
                        assignedToId = p.getAssignedTo().getId();
                        assignedToName = p.getAssignedTo().getPerson() != null
                                ? p.getAssignedTo().getPerson().getFullName()
                                : p.getAssignedTo().getEmail();
                    }
                    return PrProjectResponse.PhaseInfo.builder()
                            .id(p.getId())
                            .phaseNumber(p.getPhaseNumber())
                            .name(p.getName())
                            .isCompleted(p.getIsCompleted())
                            .completedAt(p.getCompletedAt())
                            .assignedToId(assignedToId)
                            .assignedToName(assignedToName)
                            .taskId(p.getTask() != null ? p.getTask().getId() : null)
                            .startDate(p.getStartDate())
                            .endDate(p.getEndDate())
                            .notes(p.getNotes())
                            .status(p.getStatus())
                            .phaseNotes(allNotes.stream()
                                    .filter(n -> n.getPhase().getId().equals(p.getId()))
                                    .map(n -> PrProjectResponse.PhaseNoteInfo.builder()
                                            .id(n.getId())
                                            .authorId(n.getAuthor().getId())
                                            .authorName(n.getAuthor().getPerson() != null
                                                    ? n.getAuthor().getPerson().getFullName()
                                                    : n.getAuthor().getEmail())
                                            .content(n.getContent())
                                            .createdAt(n.getCreatedAt())
                                            .build()).toList())
                            .build();
                }).toList())
                .members(members.stream().map(m -> PrProjectResponse.MemberInfo.builder()
                        .userId(m.getUser().getId())
                        .fullName(m.getUser().getPerson() != null ? m.getUser().getPerson().getFullName() : m.getUser().getEmail())
                        .build()).toList())
                .createdAt(project.getCreatedAt())
                .build();
    }

    private Instant parseInstant(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            if (dateStr.contains("T")) {
                return Instant.parse(dateStr);
            }
            return Instant.parse(dateStr + "T00:00:00Z");
        } catch (Exception e) {
            return null;
        }
    }
}
