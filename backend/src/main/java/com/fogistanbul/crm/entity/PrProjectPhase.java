package com.fogistanbul.crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pr_project_phases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrProjectPhase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private PrProject project;

    @Column(name = "phase_number", nullable = false)
    private Integer phaseNumber;

    @Column(nullable = false)
    private String name;

    @Column(name = "is_completed")
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(name = "completed_at")
    private Instant completedAt;
}
