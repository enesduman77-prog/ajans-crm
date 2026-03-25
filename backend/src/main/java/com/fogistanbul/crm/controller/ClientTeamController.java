package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.entity.CompanyMembership;
import com.fogistanbul.crm.entity.enums.MembershipRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/client/team")
@RequiredArgsConstructor
public class ClientTeamController {

    private final CompanyMembershipRepository membershipRepository;

    @GetMapping
    public ResponseEntity<TeamResponse> getTeam(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();

        List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
        if (companyIds.isEmpty()) {
            return ResponseEntity.ok(new TeamResponse(List.of(), List.of()));
        }

        List<CompanyMembership> allMembers = membershipRepository.findByCompanyIdWithDetails(companyIds.get(0));

        List<TeamMemberResponse> agencyStaff = allMembers.stream()
                .filter(m -> m.getMembershipRole() == MembershipRole.AGENCY_STAFF)
                .map(this::toMemberResponse)
                .toList();

        List<TeamMemberResponse> employees = allMembers.stream()
                .filter(m -> m.getMembershipRole() == MembershipRole.OWNER || m.getMembershipRole() == MembershipRole.EMPLOYEE)
                .filter(m -> !m.getUser().getId().equals(userId))
                .map(this::toMemberResponse)
                .toList();

        return ResponseEntity.ok(new TeamResponse(agencyStaff, employees));
    }

    private TeamMemberResponse toMemberResponse(CompanyMembership m) {
        var person = m.getUser().getPerson();
        return new TeamMemberResponse(
                m.getUser().getId().toString(),
                person != null ? person.getFullName() : m.getUser().getEmail(),
                m.getUser().getEmail(),
                person != null ? person.getAvatarUrl() : null,
                person != null ? person.getPhone() : null,
                person != null ? person.getPositionTitle() : null,
                person != null ? person.getDepartment() : null,
                m.getMembershipRole().name(),
                m.getCompany().getName()
        );
    }

    public record TeamResponse(
            List<TeamMemberResponse> agencyStaff,
            List<TeamMemberResponse> employees
    ) {}

    public record TeamMemberResponse(
            String id,
            String fullName,
            String email,
            String avatarUrl,
            String phone,
            String position,
            String department,
            String membershipRole,
            String companyName
    ) {}
}
