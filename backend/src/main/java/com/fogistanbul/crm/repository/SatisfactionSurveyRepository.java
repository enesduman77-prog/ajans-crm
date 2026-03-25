package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.SatisfactionSurvey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SatisfactionSurveyRepository extends JpaRepository<SatisfactionSurvey, UUID> {
    List<SatisfactionSurvey> findByCompanyIdOrderBySurveyMonthDesc(UUID companyId);
    List<SatisfactionSurvey> findBySubmittedById(UUID userId);
    Optional<SatisfactionSurvey> findByCompanyIdAndSubmittedByIdAndSurveyMonth(UUID companyId, UUID userId, LocalDate surveyMonth);
}
