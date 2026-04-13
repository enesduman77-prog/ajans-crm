package com.fogistanbul.crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "shoot_equipment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShootEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shoot_id", nullable = false)
    private Shoot shoot;

    @Column(nullable = false, length = 300)
    private String name;

    @Builder.Default
    private Integer quantity = 1;

    @Column(length = 500)
    private String notes;
}
