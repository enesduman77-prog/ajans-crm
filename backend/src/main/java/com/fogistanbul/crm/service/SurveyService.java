package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.CreateSurveyRequest;
import com.fogistanbul.crm.dto.SurveyResponse;
import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.SatisfactionSurvey;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.SatisfactionSurveyRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SurveyService {

    private final SatisfactionSurveyRepository surveyRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyRepository companyRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional
    public SurveyResponse submitSurvey(UUID userId, CreateSurveyRequest request) {
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        // Find the company the user belongs to
        UUID companyId = membershipRepository.findByUserId(userId).stream()
                .filter(m -> !m.getCompany().getKind().name().equals("AGENCY"))
                .map(m -> m.getCompany().getId())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Şirket bulunamadı"));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Şirket bulunamadı"));

        // Current month
        LocalDate surveyMonth = LocalDate.now().withDayOfMonth(1);

        // Check if already submitted this month
        surveyRepository.findByCompanyIdAndSubmittedByIdAndSurveyMonth(companyId, userId, surveyMonth)
                .ifPresent(s -> {
                    throw new RuntimeException("Bu ay için zaten anket gönderdiniz");
                });

        SatisfactionSurvey survey = SatisfactionSurvey.builder()
                .company(company)
                .score(request.getScore())
                .surveyMonth(surveyMonth)
                .comment(request.getComment())
                .submittedBy(user)
                .build();

        survey = surveyRepository.save(survey);
        return toResponse(survey);
    }

    @Transactional(readOnly = true)
    public List<SurveyResponse> getMySurveys(UUID userId) {
        return surveyRepository.findBySubmittedById(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SurveyResponse> getCompanySurveys(UUID companyId) {
        return surveyRepository.findByCompanyIdOrderBySurveyMonthDesc(companyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SurveyResponse> getAllSurveys() {
        return surveyRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private SurveyResponse toResponse(SatisfactionSurvey survey) {
        return SurveyResponse.builder()
                .id(survey.getId().toString())
                .companyId(survey.getCompany().getId().toString())
                .companyName(survey.getCompany().getName())
                .score(survey.getScore())
                .surveyMonth(survey.getSurveyMonth().toString())
                .submittedById(survey.getSubmittedBy().getId().toString())
                .submittedByName(survey.getSubmittedBy().getPerson() != null
                        ? survey.getSubmittedBy().getPerson().getFullName()
                        : survey.getSubmittedBy().getEmail())
                .createdAt(survey.getCreatedAt())
                .build();
    }
}
