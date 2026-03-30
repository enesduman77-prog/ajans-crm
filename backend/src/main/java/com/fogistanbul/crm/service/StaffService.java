package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.CreateStaffRequest;
import com.fogistanbul.crm.dto.StaffResponse;
import com.fogistanbul.crm.entity.*;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.MembershipRole;
import com.fogistanbul.crm.repository.*;
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
public class StaffService {

    private final PersonRepository personRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyRepository companyRepository;
    private final CompanyMembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final GroupMessagingService groupMessagingService;
    private final EntityManager entityManager;

    // FOG İstanbul (Agency) şirket ID'si
    private static final UUID AGENCY_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Transactional
    public StaffResponse createStaff(CreateStaffRequest req) {
        if (userProfileRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Bu email ile kayıtlı bir kullanıcı zaten var: " + req.getEmail());
        }

        // 1. Kişi oluştur (FOG İstanbul'a bağlı)
        Company agency = companyRepository.findById(AGENCY_ID)
                .orElseThrow(() -> new RuntimeException("Ajans şirketi bulunamadı"));

        Person person = new Person();
        person.setCompany(agency);
        person.setFullName(req.getFullName());
        person.setEmail(req.getEmail());
        person.setPhone(req.getPhone());
        person.setPositionTitle(req.getPosition());
        person.setDepartment(req.getDepartment());
        person = personRepository.save(person);

        // 2. Kullanıcı profili oluştur
        UserProfile userProfile = new UserProfile();
        userProfile.setPerson(person);
        userProfile.setGlobalRole(GlobalRole.AGENCY_STAFF);
        userProfile.setEmail(req.getEmail());
        userProfile.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        userProfile = userProfileRepository.save(userProfile);

        // 3. Ajans membership'i oluştur
        CompanyMembership membership = new CompanyMembership();
        membership.setUser(userProfile);
        membership.setCompany(agency);
        membership.setMembershipRole(MembershipRole.AGENCY_STAFF);
        membershipRepository.save(membership);

        if (req.getInitialCompanyId() != null) {
            assignToCompany(userProfile.getId(), req.getInitialCompanyId());
        }

        return toResponse(userProfile);
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> getAllStaff() {
        return userProfileRepository.findByGlobalRole(GlobalRole.AGENCY_STAFF).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StaffResponse getStaffById(UUID id) {
        UserProfile user = userProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Çalışan bulunamadı"));
        if (user.getGlobalRole() != GlobalRole.AGENCY_STAFF) {
            throw new RuntimeException("Bu kullanıcı bir ajans çalışanı değil");
        }
        return toResponse(user);
    }

    @Transactional
    public void assignToCompany(UUID staffUserId, UUID companyId) {
        UserProfile staff = userProfileRepository.findById(staffUserId)
                .orElseThrow(() -> new RuntimeException("Çalışan bulunamadı"));

        if (staff.getGlobalRole() != GlobalRole.AGENCY_STAFF) {
            throw new RuntimeException("Sadece ajans çalışanları şirketlere atanabilir");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Şirket bulunamadı"));

        if (membershipRepository.existsByUserIdAndCompanyId(staffUserId, companyId)) {
            throw new RuntimeException("Bu çalışan zaten bu şirkete atanmış");
        }

        CompanyMembership membership = new CompanyMembership();
        membership.setUser(staff);
        membership.setCompany(company);
        membership.setMembershipRole(MembershipRole.AGENCY_STAFF);
        membershipRepository.save(membership);

        // Auto-add staff to company group chat
        groupMessagingService.addMemberToCompanyGroup(companyId, staffUserId);
    }

    @Transactional
    public void unassignFromCompany(UUID membershipId) {
        CompanyMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new RuntimeException("Üyelik bulunamadı"));

        UUID companyId = membership.getCompany().getId();
        UUID userId = membership.getUser().getId();

        membershipRepository.delete(membership);

        // Remove staff from company group chat
        groupMessagingService.removeMemberFromCompanyGroup(companyId, userId);
    }

    @Transactional
    public void deleteStaff(UUID staffId) {
        UserProfile user = userProfileRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Çalışan bulunamadı"));
        if (user.getGlobalRole() != GlobalRole.AGENCY_STAFF) {
            throw new RuntimeException("Bu kullanıcı bir ajans çalışanı değil");
        }

        // Remove all company memberships
        List<CompanyMembership> memberships = membershipRepository.findByUserId(staffId);
        for (CompanyMembership m : memberships) {
            groupMessagingService.removeMemberFromCompanyGroup(m.getCompany().getId(), staffId);
        }
        membershipRepository.deleteAll(memberships);

        // Clean up all FK references to this user (29 FK constraints on user_profiles)
        entityManager.createNativeQuery("UPDATE tasks SET assigned_to = NULL WHERE assigned_to = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("UPDATE tasks SET created_by = NULL WHERE created_by = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM task_reviews WHERE reviewer_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM time_entries WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM notifications WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM notification_preferences WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM company_permissions WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM activity_logs WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM refresh_tokens WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM group_message_reads WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM group_members WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM group_messages WHERE sender_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM message_read_receipts WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user1_id = :uid OR user2_id = :uid)").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM messages WHERE sender_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM conversations WHERE user1_id = :uid OR user2_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM messages_threads WHERE created_by = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM file_attachments WHERE uploaded_by = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM notes WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM meeting_participants WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("UPDATE meetings SET created_by = NULL WHERE created_by = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM shoot_participants WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("UPDATE shoots SET created_by = NULL WHERE created_by = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM pr_project_members WHERE user_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("UPDATE pr_projects SET created_by = NULL WHERE created_by = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM approval_requests WHERE requester_id = :uid OR approver_id = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM satisfaction_surveys WHERE submitted_by = :uid").setParameter("uid", staffId).executeUpdate();
        entityManager.flush();

        // Delete user profile and person
        Person person = user.getPerson();
        userProfileRepository.delete(user);
        if (person != null) {
            personRepository.delete(person);
        }
    }

    private StaffResponse toResponse(UserProfile user) {
        Person p = user.getPerson();
        List<CompanyMembership> memberships = membershipRepository.findByUserId(user.getId());

        List<StaffResponse.AssignedCompany> assigned = memberships.stream()
                .filter(m -> m.getCompany().getId() != null && !m.getCompany().getId().equals(AGENCY_ID))
                .map(m -> StaffResponse.AssignedCompany.builder()
                        .membershipId(m.getId().toString())
                        .companyId(m.getCompany().getId().toString())
                        .companyName(m.getCompany().getName())
                        .membershipRole(m.getMembershipRole().name())
                        .build())
                .collect(Collectors.toList());

        return StaffResponse.builder()
                .id(user.getId().toString())
                .fullName(p != null ? p.getFullName() : user.getEmail())
                .email(user.getEmail())
                .phone(p != null ? p.getPhone() : null)
                .position(p != null ? p.getPositionTitle() : null)
                .department(p != null ? p.getDepartment() : null)
                .avatarUrl(p != null ? p.getAvatarUrl() : null)
                .globalRole(user.getGlobalRole().name())
                .assignedCompanies(assigned)
                .build();
    }
}
