package com.fogistanbul.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurveyResponse {
    private String id;
    private String companyId;
    private String companyName;
    private int score;
    private String surveyMonth;
    private String submittedById;
    private String submittedByName;
    private Instant createdAt;
}
