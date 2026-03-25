package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.DashboardStats;
import com.fogistanbul.crm.entity.enums.CompanyKind;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.TaskRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CompanyRepository companyRepository;
    private final UserProfileRepository userProfileRepository;
    private final TaskRepository taskRepository;

    public DashboardStats getStats() {
        long totalCompanies = companyRepository.countByKind(CompanyKind.CLIENT);
        long totalStaff = userProfileRepository.countByGlobalRole(GlobalRole.AGENCY_STAFF);
        long totalTasks = taskRepository.count();
        long todoTasks = taskRepository.countByStatus(TaskStatus.TODO);
        long inProgressTasks = taskRepository.countByStatus(TaskStatus.IN_PROGRESS);
        long doneTasks = taskRepository.countByStatus(TaskStatus.DONE);

        return DashboardStats.builder()
                .totalCompanies(totalCompanies)
                .activeCompanies(totalCompanies)
                .totalStaff(totalStaff)
                .totalTasks(totalTasks)
                .todoTasks(todoTasks)
                .inProgressTasks(inProgressTasks)
                .doneTasks(doneTasks)
                .build();
    }
}
