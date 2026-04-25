package com.fogistanbul.crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pagespeed_snapshots", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"company_id", "strategy"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageSpeedSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false, length = 16)
    private String strategy;

    @Column(name = "tested_url", nullable = false)
    private String testedUrl;

    private Integer performance;
    private Integer accessibility;

    @Column(name = "best_practices")
    private Integer bestPractices;

    private Integer seo;

    @Column(name = "lcp_ms")
    private Double lcpMs;

    @Column(name = "fid_ms")
    private Double fidMs;

    @Column(name = "cls_value")
    private Double clsValue;

    @Column(name = "tbt_ms")
    private Double tbtMs;

    @Column(name = "fcp_ms")
    private Double fcpMs;

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt;

    @Column(name = "fetch_error", columnDefinition = "TEXT")
    private String fetchError;
}
