package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class PageSpeedScoreResponse {
    private String strategy;
    private String testedUrl;
    private Integer performance;
    private Integer accessibility;
    private Integer bestPractices;
    private Integer seo;
    private Double lcpMs;
    private Double fidMs;
    private Double clsValue;
    private Double tbtMs;
    private Double fcpMs;
    private Instant fetchedAt;
    private String fetchError;
}
