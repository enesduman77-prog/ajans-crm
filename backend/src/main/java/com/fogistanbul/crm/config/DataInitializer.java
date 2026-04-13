package com.fogistanbul.crm.config;

import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.TaskRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import com.fogistanbul.crm.repository.PersonRepository;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.entity.enums.Priority;
import com.fogistanbul.crm.entity.enums.TaskCategory;
import com.fogistanbul.crm.entity.enums.TaskStatus;
import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.entity.Company;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

        private final UserProfileRepository userProfileRepository;
        private final PersonRepository personRepository;
        private final CompanyRepository companyRepository;
        private final CompanyMembershipRepository membershipRepository;
        private final TaskRepository taskRepository;
        private final PasswordEncoder passwordEncoder;

        @Override
        public void run(String... args) {
                log.info("Checking for admin user...");
                userProfileRepository.findByEmail("admin@fogistanbul.com").ifPresentOrElse(
                                user -> {
                                        log.info("Admin user found, skipping password reset.");

                                        // Add Mehmet user if not exists
                                        if (userProfileRepository.findByEmail("mehmet@fogistanbul.com").isEmpty()) {
                                                log.info("Creating user mehmet@fogistanbul.com...");
                                                Company fog = companyRepository.findAll().stream()
                                                                .filter(c -> c.getName().contains("FOG"))
                                                                .findFirst().orElse(null);

                                                if (fog != null) {
                                                        var person = com.fogistanbul.crm.entity.Person.builder()
                                                                        .company(fog)
                                                                        .fullName("Mehmet")
                                                                        .email("mehmet@fogistanbul.com")
                                                                        .positionTitle("Yönetici")
                                                                        .build();
                                                        person = personRepository.save(person);

                                                        var mehmetUser = com.fogistanbul.crm.entity.UserProfile
                                                                        .builder()
                                                                        .email("mehmet@fogistanbul.com")
                                                                        .passwordHash(passwordEncoder
                                                                                        .encode("mehmet123"))
                                                                        .globalRole(GlobalRole.ADMIN)
                                                                        .person(person)
                                                                        .build();
                                                        mehmetUser = userProfileRepository.save(mehmetUser);
                                                        log.info("User mehmet@fogistanbul.com created successfully.");

                                                        // Add membership
                                                        if (!membershipRepository.existsByUserIdAndCompanyId(
                                                                        mehmetUser.getId(), fog.getId())) {
                                                                membershipRepository.save(
                                                                                com.fogistanbul.crm.entity.CompanyMembership
                                                                                                .builder()
                                                                                                .user(mehmetUser)
                                                                                                .company(fog)
                                                                                                .membershipRole(com.fogistanbul.crm.entity.enums.MembershipRole.OWNER)
                                                                                                .build());
                                                        }
                                                }
                                        } else {
                                                // Ensure existing Mehmet has membership
                                                userProfileRepository.findByEmail("mehmet@fogistanbul.com")
                                                                .ifPresent(mehmet -> {
                                                                        Company fog = companyRepository.findAll()
                                                                                        .stream()
                                                                                        .filter(c -> c.getName()
                                                                                                        .contains("FOG"))
                                                                                        .findFirst().orElse(null);
                                                                        if (fog != null && !membershipRepository
                                                                                        .existsByUserIdAndCompanyId(
                                                                                                        mehmet.getId(),
                                                                                                        fog.getId())) {
                                                                                membershipRepository.save(
                                                                                                com.fogistanbul.crm.entity.CompanyMembership
                                                                                                                .builder()
                                                                                                                .user(mehmet)
                                                                                                                .company(fog)
                                                                                                                .membershipRole(com.fogistanbul.crm.entity.enums.MembershipRole.OWNER)
                                                                                                                .build());
                                                                                log.info("Added FOG membership for mehmet@fogistanbul.com");
                                                                        }
                                                                });
                                        }

                                        // Add or reset SUPERADMIN user
                                        userProfileRepository.findByEmail("superadmin@fogistanbul.com").ifPresentOrElse(
                                                        superAdmin -> {
                                                                log.info("Superadmin user found, skipping password reset.");
                                                        },
                                                        () -> {
                                                                log.info("Creating user superadmin@fogistanbul.com...");
                                                                Company fogCompany = companyRepository.findAll()
                                                                                .stream()
                                                                                .filter(c -> c.getName()
                                                                                                .contains("FOG"))
                                                                                .findFirst().orElse(null);

                                                                if (fogCompany != null) {
                                                                        var person = com.fogistanbul.crm.entity.Person
                                                                                        .builder()
                                                                                        .company(fogCompany)
                                                                                        .fullName("Super Admin")
                                                                                        .email("superadmin@fogistanbul.com")
                                                                                        .positionTitle("Sistem Yöneticisi")
                                                                                        .build();
                                                                        person = personRepository.save(person);

                                                                        var superAdminUser = com.fogistanbul.crm.entity.UserProfile
                                                                                        .builder()
                                                                                        .email("superadmin@fogistanbul.com")
                                                                                        .passwordHash(passwordEncoder
                                                                                                        .encode("Super123!"))
                                                                                        .globalRole(GlobalRole.ADMIN)
                                                                                        .person(person)
                                                                                        .build();
                                                                        userProfileRepository.save(superAdminUser);
                                                                        log.info("User superadmin@fogistanbul.com created successfully.");
                                                                }
                                                        });

                                        // Create sample tasks if none exist
                                        if (taskRepository.count() == 0) {
                                                log.info("Creating sample tasks...");
                                                Company fog = companyRepository.findAll().stream()
                                                                .filter(c -> c.getName().contains("FOG"))
                                                                .findFirst().orElse(null);

                                                if (fog != null) {
                                                        taskRepository.save(Task.builder()
                                                                        .company(fog)
                                                                        .createdBy(user)
                                                                        .assignedTo(user)
                                                                        .title("Sistem Kontrolü")
                                                                        .description("Yeni CRM sisteminin genel kontrollerini yap.")
                                                                        .category(TaskCategory.OTHER)
                                                                        .status(TaskStatus.TODO)
                                                                        .build());

                                                        taskRepository.save(Task.builder()
                                                                        .company(fog)
                                                                        .createdBy(user)
                                                                        .assignedTo(user)
                                                                        .title("Müşteri Listesi Güncelleme")
                                                                        .description("Veri aktarımı yapılacak.")
                                                                        .category(TaskCategory.OTHER)
                                                                        .status(TaskStatus.IN_PROGRESS)
                                                                        .build());
                                                        log.info("Sample tasks created.");
                                                }
                                        }
                                },
                                () -> log.error("ADMIN USER NOT FOUND! Check your seed data."));
        }
}
