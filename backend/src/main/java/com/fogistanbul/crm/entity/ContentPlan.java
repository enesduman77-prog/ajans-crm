package com.fogistanbul.crm.entity;

import com.fogistanbul.crm.entity.enums.ContentPlatform;
import com.fogistanbul.crm.entity.enums.ContentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "content_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserProfile createdBy;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentPlatform platform;

    @Column(name = "content_size")
    private String contentSize;

    @Column(columnDefinition = "TEXT")
    private String direction;

    @Column(name = "speaker_model")
    private String speakerModel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ContentStatus status = ContentStatus.DRAFT;

    @Column(name = "revision_note", columnDefinition = "TEXT")
    private String revisionNote;

    @Column(name = "planned_date")
    private LocalDate plannedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shoot_id")
    private Shoot shoot;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
