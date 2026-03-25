package com.fogistanbul.crm.entity;

import com.fogistanbul.crm.entity.enums.ShootStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "shoots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shoot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "shoot_date")
    private Instant shootDate;

    @Column(name = "shoot_time")
    private LocalTime shootTime;

    private String location;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ShootStatus status = ShootStatus.PLANNED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserProfile createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
