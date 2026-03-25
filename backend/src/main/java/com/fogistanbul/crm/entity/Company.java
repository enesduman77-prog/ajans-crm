package com.fogistanbul.crm.entity;

import com.fogistanbul.crm.entity.enums.CompanyKind;
import com.fogistanbul.crm.entity.enums.ContractStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "companies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyKind kind;

    @Column(nullable = false)
    private String name;

    private String industry;

    @Column(name = "tax_id")
    private String taxId;

    @Column(name = "founded_year")
    private Integer foundedYear;

    private String vision;
    private String mission;

    @Column(name = "employee_count")
    private Integer employeeCount;

    private String email;
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String website;

    @Column(name = "social_instagram")
    private String socialInstagram;

    @Column(name = "social_facebook")
    private String socialFacebook;

    @Column(name = "social_twitter")
    private String socialTwitter;

    @Column(name = "social_linkedin")
    private String socialLinkedin;

    @Column(name = "social_youtube")
    private String socialYoutube;

    @Column(name = "social_tiktok")
    private String socialTiktok;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_status")
    @Builder.Default
    private ContractStatus contractStatus = ContractStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
