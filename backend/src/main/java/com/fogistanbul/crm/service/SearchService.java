package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.SearchResponse;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.entity.enums.CompanyKind;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.NoteRepository;
import com.fogistanbul.crm.repository.TaskRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final CompanyRepository companyRepository;
    private final TaskRepository taskRepository;
    private final UserProfileRepository userProfileRepository;
    private final NoteRepository noteRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional(readOnly = true)
    public SearchResponse search(String query, UUID userId, String role) {
        String q = query.toLowerCase();

        List<SearchResponse.SearchResult> companies = new ArrayList<>();
        List<SearchResponse.SearchResult> tasks = new ArrayList<>();
        List<SearchResponse.SearchResult> staff = new ArrayList<>();
        List<SearchResponse.SearchResult> notes = new ArrayList<>();

        List<Company> searchableCompanies;
        List<Task> searchableTasks;

        if ("ADMIN".equals(role)) {
            searchableCompanies = companyRepository.findByKind(CompanyKind.CLIENT);
            searchableTasks = taskRepository.findAll();
        } else {
            List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
            if (companyIds.isEmpty()) {
                searchableCompanies = List.of();
                searchableTasks = List.of();
            } else {
                searchableCompanies = companyRepository.findByIdInAndKind(companyIds, CompanyKind.CLIENT);
                searchableTasks = taskRepository.findByCompanyIdIn(companyIds);
            }
        }

        searchableCompanies.stream()
                .filter(c -> c.getName().toLowerCase().contains(q)
                        || (c.getIndustry() != null && c.getIndustry().toLowerCase().contains(q)))
                .limit(5)
                .forEach(c -> companies.add(SearchResponse.SearchResult.builder()
                        .id(c.getId().toString())
                        .title(c.getName())
                        .subtitle(c.getIndustry())
                        .type("COMPANY")
                        .route(role.equals("ADMIN") ? "/admin/companies/" + c.getId() : "/staff/companies/" + c.getId())
                        .build()));

        searchableTasks.stream()
                .filter(t -> t.getTitle().toLowerCase().contains(q)
                        || (t.getDescription() != null && t.getDescription().toLowerCase().contains(q)))
                .limit(5)
                .forEach(t -> tasks.add(SearchResponse.SearchResult.builder()
                        .id(t.getId().toString())
                        .title(t.getTitle())
                        .subtitle(t.getCompany().getName() + " - " + t.getStatus().name())
                        .type("TASK")
                        .route("/staff/tasks")
                        .build()));

        if ("ADMIN".equals(role)) {
            userProfileRepository.findAll().stream()
                    .filter(u -> u.getGlobalRole() == GlobalRole.AGENCY_STAFF)
                    .filter(u -> (u.getPerson() != null && u.getPerson().getFullName().toLowerCase().contains(q))
                            || u.getEmail().toLowerCase().contains(q))
                    .limit(5)
                    .forEach(u -> staff.add(SearchResponse.SearchResult.builder()
                            .id(u.getId().toString())
                            .title(u.getPerson() != null ? u.getPerson().getFullName() : u.getEmail())
                            .subtitle(u.getEmail())
                            .type("STAFF")
                            .route("/admin/staff/" + u.getId())
                            .build()));
        }

        noteRepository.findAll().stream()
                .filter(n -> n.getUser().getId().equals(userId))
                .filter(n -> n.getContent().toLowerCase().contains(q)
                        || (n.getTitle() != null && n.getTitle().toLowerCase().contains(q)))
                .limit(5)
                .forEach(n -> notes.add(SearchResponse.SearchResult.builder()
                        .id(n.getId().toString())
                        .title(n.getTitle() != null ? n.getTitle() : n.getContent().substring(0, Math.min(50, n.getContent().length())))
                        .subtitle(n.getCompany() != null ? n.getCompany().getName() : "Kisisel not")
                        .type("NOTE")
                        .route("/staff/notes")
                        .build()));

        return SearchResponse.builder()
                .companies(companies)
                .tasks(tasks)
                .staff(staff)
                .notes(notes)
                .build();
    }
}
