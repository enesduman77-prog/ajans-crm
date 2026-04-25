package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.AddEmployeeRequest;
import com.fogistanbul.crm.dto.CompanyInfrastructureRequest;
import com.fogistanbul.crm.dto.CompanyResponse;
import com.fogistanbul.crm.dto.CreateCompanyRequest;
import com.fogistanbul.crm.dto.UpdateCompanyRequest;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.CompanyMembership;
import com.fogistanbul.crm.entity.Person;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.CompanyKind;
import com.fogistanbul.crm.entity.enums.ContractStatus;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.MembershipRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.PersonRepository;
import com.fogistanbul.crm.repository.TaskRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final PersonRepository personRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyMembershipRepository membershipRepository;
    private final TaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionService permissionService;
    private final GroupMessagingService groupMessagingService;
    private final EntityManager entityManager;

    @Transactional
    public CompanyResponse createCompanyWithOwner(CreateCompanyRequest req) {
        if (userProfileRepository.existsByEmail(req.getOwnerEmail())) {
            throw new RuntimeException("Bu email ile kayitli bir kullanici zaten var: " + req.getOwnerEmail());
        }

        Company company = new Company();
        company.setKind(CompanyKind.CLIENT);
        company.setName(req.getName());
        company.setIndustry(req.getIndustry());
        company.setTaxId(req.getTaxId());
        company.setFoundedYear(req.getFoundedYear());
        company.setVision(req.getVision());
        company.setMission(req.getMission());
        company.setEmployeeCount(req.getEmployeeCount());
        company.setEmail(req.getEmail());
        company.setPhone(req.getPhone());
        company.setAddress(req.getAddress());
        company.setWebsite(req.getWebsite());
        company.setSocialInstagram(req.getSocialInstagram());
        company.setSocialFacebook(req.getSocialFacebook());
        company.setSocialTwitter(req.getSocialTwitter());
        company.setSocialLinkedin(req.getSocialLinkedin());
        company.setSocialYoutube(req.getSocialYoutube());
        company.setSocialTiktok(req.getSocialTiktok());
        company.setNotes(req.getNotes());
        company.setContractStatus(ContractStatus.ACTIVE);
        company = companyRepository.save(company);

        Person person = new Person();
        person.setCompany(company);
        person.setFullName(req.getOwnerFullName());
        person.setEmail(req.getOwnerEmail());
        person.setPhone(req.getOwnerPhone());
        person.setPositionTitle(req.getOwnerPosition());
        person = personRepository.save(person);

        UserProfile userProfile = new UserProfile();
        userProfile.setPerson(person);
        userProfile.setGlobalRole(GlobalRole.COMPANY_USER);
        userProfile.setEmail(req.getOwnerEmail());
        userProfile.setPasswordHash(passwordEncoder.encode(req.getOwnerPassword()));
        userProfile = userProfileRepository.save(userProfile);

        CompanyMembership membership = new CompanyMembership();
        membership.setUser(userProfile);
        membership.setCompany(company);
        membership.setMembershipRole(MembershipRole.OWNER);
        membershipRepository.save(membership);

        // Auto-create company group chat and add owner
        groupMessagingService.createCompanyGroup(company, userProfile);

        return toResponse(company);
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> getAllClients() {
        return companyRepository.findByKind(CompanyKind.CLIENT).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> getAllClientsForUser(UUID userId, String role) {
        if ("ADMIN".equals(role)) {
            return getAllClients();
        }

        List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        if (companyIds.isEmpty()) {
            return List.of();
        }

        return companyRepository.findByIdInAndKind(companyIds, CompanyKind.CLIENT).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CompanyResponse getById(UUID id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
        return toDetailedResponse(company);
    }

    @Transactional(readOnly = true)
    public CompanyResponse getByIdForUser(UUID id, UUID userId, String role) {
        if (!"ADMIN".equals(role) && !membershipRepository.existsByUserIdAndCompanyId(userId, id)) {
            throw new RuntimeException("Bu sirkete erisim yetkiniz yok");
        }
        return getById(id);
    }

    @Transactional
    public CompanyResponse update(UUID id, UpdateCompanyRequest req) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));

        company.setName(req.getName());
        company.setIndustry(req.getIndustry());
        company.setTaxId(req.getTaxId());
        company.setFoundedYear(req.getFoundedYear());
        company.setVision(req.getVision());
        company.setMission(req.getMission());
        company.setEmployeeCount(req.getEmployeeCount());
        company.setEmail(req.getEmail());
        company.setPhone(req.getPhone());
        company.setAddress(req.getAddress());
        company.setWebsite(req.getWebsite());
        company.setSocialInstagram(req.getSocialInstagram());
        company.setSocialFacebook(req.getSocialFacebook());
        company.setSocialTwitter(req.getSocialTwitter());
        company.setSocialLinkedin(req.getSocialLinkedin());
        company.setSocialYoutube(req.getSocialYoutube());
        company.setSocialTiktok(req.getSocialTiktok());
        company.setNotes(req.getNotes());
        company.setHostingProvider(req.getHostingProvider());
        company.setDomainExpiry(req.getDomainExpiry());
        company.setSslExpiry(req.getSslExpiry());
        company.setCmsType(req.getCmsType());
        company.setCmsVersion(req.getCmsVersion());
        company.setThemeName(req.getThemeName());
        company = companyRepository.save(company);

        return toResponse(company);
    }

    @Transactional
    public CompanyResponse updateInfrastructure(UUID id, CompanyInfrastructureRequest req) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));
        company.setHostingProvider(req.getHostingProvider());
        company.setDomainExpiry(req.getDomainExpiry());
        company.setSslExpiry(req.getSslExpiry());
        company.setCmsType(req.getCmsType());
        company.setCmsVersion(req.getCmsVersion());
        company.setThemeName(req.getThemeName());
        company = companyRepository.save(company);
        return toDetailedResponse(company);
    }

    @Transactional
    public void addEmployeeToCompany(UUID companyId, AddEmployeeRequest req) {
        if (userProfileRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Bu email ile kayitli bir kullanici zaten var: " + req.getEmail());
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));

        Person person = new Person();
        person.setCompany(company);
        person.setFullName(req.getFullName());
        person.setEmail(req.getEmail());
        person.setPhone(req.getPhone());
        person.setPositionTitle(req.getPosition());
        person.setDepartment(req.getDepartment());
        person = personRepository.save(person);

        UserProfile userProfile = new UserProfile();
        userProfile.setPerson(person);
        userProfile.setGlobalRole(GlobalRole.COMPANY_USER);
        userProfile.setEmail(req.getEmail());
        userProfile.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        userProfile = userProfileRepository.save(userProfile);

        CompanyMembership membership = new CompanyMembership();
        membership.setUser(userProfile);
        membership.setCompany(company);
        membership.setMembershipRole(MembershipRole.EMPLOYEE);
        membershipRepository.save(membership);

        permissionService.setDefaultPermissions(userProfile.getId(), companyId, "EMPLOYEE");

        // Auto-add employee to company group chat
        groupMessagingService.addMemberToCompanyGroup(companyId, userProfile.getId());
    }

    @Transactional
    public void removeEmployeeFromCompany(UUID companyId, UUID userId) {
        CompanyMembership membership = membershipRepository.findByUserIdAndCompanyId(userId, companyId)
                .orElseThrow(() -> new RuntimeException("Bu kullanici bu sirkette bulunamadi"));
        membershipRepository.delete(membership);

        // Remove employee from company group chat
        groupMessagingService.removeMemberFromCompanyGroup(companyId, userId);
    }

    @Transactional
    public void deleteCompany(UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Sirket bulunamadi"));

        // Collect company-only users (not agency staff) to delete after cleanup
        List<CompanyMembership> memberships = membershipRepository.findByCompanyId(companyId);
        List<UUID> companyUserIds = memberships.stream()
                .map(m -> m.getUser())
                .filter(u -> u.getGlobalRole() == GlobalRole.COMPANY_USER)
                .map(u -> u.getId())
                .collect(Collectors.toList());

        // Remove all memberships and their group chat associations
        for (CompanyMembership m : memberships) {
            groupMessagingService.removeMemberFromCompanyGroup(companyId, m.getUser().getId());
        }
        membershipRepository.deleteAll(memberships);

        // Clean up all FK references for company users before deleting them
        for (UUID uid : companyUserIds) {
            entityManager.createNativeQuery("UPDATE tasks SET assigned_to = NULL WHERE assigned_to = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("UPDATE tasks SET created_by = NULL WHERE created_by = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM task_reviews WHERE reviewer_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM time_entries WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM notifications WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM notification_preferences WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM company_permissions WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM activity_logs WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM refresh_tokens WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM group_message_reads WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM group_members WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM group_messages WHERE sender_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM message_read_receipts WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user1_id = :uid OR user2_id = :uid)").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM messages WHERE sender_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM conversations WHERE user1_id = :uid OR user2_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM messages_threads WHERE created_by = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM file_attachments WHERE uploaded_by = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM notes WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM meeting_participants WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("UPDATE meetings SET created_by = NULL WHERE created_by = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM shoot_participants WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("UPDATE shoots SET created_by = NULL WHERE created_by = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM pr_project_members WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("UPDATE pr_projects SET created_by = NULL WHERE created_by = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM approval_requests WHERE requester_id = :uid OR approver_id = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM satisfaction_surveys WHERE submitted_by = :uid").setParameter("uid", uid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM company_memberships WHERE user_id = :uid").setParameter("uid", uid).executeUpdate();
        }

        // Clean up all FK references to this company before deleting
        // Task child tables first
        entityManager.createNativeQuery("DELETE FROM task_reviews WHERE task_id IN (SELECT id FROM tasks WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM time_entries WHERE task_id IN (SELECT id FROM tasks WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM tasks WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM time_entries WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        // Shoot child tables
        entityManager.createNativeQuery("DELETE FROM shoot_participants WHERE shoot_id IN (SELECT id FROM shoots WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM shoots WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        // Meeting child tables
        entityManager.createNativeQuery("DELETE FROM meeting_participants WHERE meeting_id IN (SELECT id FROM meetings WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM meetings WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        // PR project child tables
        entityManager.createNativeQuery("DELETE FROM pr_project_phases WHERE project_id IN (SELECT id FROM pr_projects WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM pr_project_members WHERE project_id IN (SELECT id FROM pr_projects WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM pr_projects WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        // Group messaging
        entityManager.createNativeQuery("DELETE FROM group_message_reads WHERE message_id IN (SELECT id FROM group_messages WHERE group_id IN (SELECT id FROM group_conversations WHERE company_id = :cid))").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM group_messages WHERE group_id IN (SELECT id FROM group_conversations WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM group_members WHERE group_id IN (SELECT id FROM group_conversations WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM group_conversations WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        // Other direct FK tables
        entityManager.createNativeQuery("DELETE FROM notes WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM messages_threads WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM approval_requests WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM company_permissions WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM satisfaction_surveys WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM google_oauth_tokens WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM persons WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();

        // Delete company users (COMPANY_USER only, not agency staff)
        for (UUID uid : companyUserIds) {
            entityManager.createNativeQuery("DELETE FROM user_profiles WHERE id = :uid").setParameter("uid", uid).executeUpdate();
        }

        // Delete company via native SQL to avoid Hibernate TransientObjectException
        entityManager.createNativeQuery("DELETE FROM companies WHERE id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.flush();
        entityManager.clear();
    }

    private CompanyResponse toResponse(Company company) {
        List<CompanyMembership> memberships = membershipRepository.findByCompanyId(company.getId());
        long taskCount = taskRepository.countByCompanyId(company.getId());
        int employeeCount = (int) memberships.stream().filter(m -> m.getMembershipRole().name().equals("OWNER") || m.getMembershipRole().name().equals("EMPLOYEE")).count();
        int staffCount = (int) memberships.stream().filter(m -> m.getMembershipRole().name().equals("AGENCY_STAFF")).count();

        return CompanyResponse.builder()
                .id(company.getId().toString())
                .kind(company.getKind().name())
                .name(company.getName())
                .industry(company.getIndustry())
                .email(company.getEmail())
                .phone(company.getPhone())
                .contractStatus(company.getContractStatus() != null ? company.getContractStatus().name() : null)
                .logoUrl(company.getLogoUrl())
                .createdAt(company.getCreatedAt())
                .memberCount(memberships.size())
                .employeeCount(employeeCount)
                .staffCount(staffCount)
                .taskCount((int) taskCount)
                .build();
    }

    private CompanyResponse toDetailedResponse(Company company) {
        List<CompanyMembership> memberships = membershipRepository.findByCompanyId(company.getId());
        long taskCount = taskRepository.countByCompanyId(company.getId());

        List<CompanyResponse.MembershipInfo> memberInfos = memberships.stream().map(m -> {
            Person p = m.getUser().getPerson();
            return CompanyResponse.MembershipInfo.builder()
                    .id(m.getId().toString())
                    .userId(m.getUser().getId().toString())
                    .fullName(p != null ? p.getFullName() : m.getUser().getEmail())
                    .email(m.getUser().getEmail())
                    .membershipRole(m.getMembershipRole().name())
                    .globalRole(m.getUser().getGlobalRole().name())
                    .avatarUrl(p != null ? p.getAvatarUrl() : null)
                    .build();
        }).collect(Collectors.toList());

        return CompanyResponse.builder()
                .id(company.getId().toString())
                .kind(company.getKind().name())
                .name(company.getName())
                .industry(company.getIndustry())
                .taxId(company.getTaxId())
                .foundedYear(company.getFoundedYear())
                .email(company.getEmail())
                .phone(company.getPhone())
                .address(company.getAddress())
                .website(company.getWebsite())
                .logoUrl(company.getLogoUrl())
                .contractStatus(company.getContractStatus() != null ? company.getContractStatus().name() : null)
                .notes(company.getNotes())
                .socialInstagram(company.getSocialInstagram())
                .socialFacebook(company.getSocialFacebook())
                .socialTwitter(company.getSocialTwitter())
                .socialLinkedin(company.getSocialLinkedin())
                .socialYoutube(company.getSocialYoutube())
                .socialTiktok(company.getSocialTiktok())
                .hostingProvider(company.getHostingProvider())
                .domainExpiry(company.getDomainExpiry())
                .sslExpiry(company.getSslExpiry())
                .cmsType(company.getCmsType())
                .cmsVersion(company.getCmsVersion())
                .themeName(company.getThemeName())
                .createdAt(company.getCreatedAt())
                .memberCount(memberInfos.size())
                .employeeCount((int) memberships.stream().filter(m -> m.getMembershipRole().name().equals("OWNER") || m.getMembershipRole().name().equals("EMPLOYEE")).count())
                .staffCount((int) memberships.stream().filter(m -> m.getMembershipRole().name().equals("AGENCY_STAFF")).count())
                .taskCount((int) taskCount)
                .members(memberInfos)
                .build();
    }
}
