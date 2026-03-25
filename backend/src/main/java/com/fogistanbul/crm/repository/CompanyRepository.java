package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.enums.CompanyKind;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    List<Company> findByKind(CompanyKind kind);
    List<Company> findByIdIn(List<UUID> ids);
    List<Company> findByIdInAndKind(List<UUID> ids, CompanyKind kind);

    long countByKind(CompanyKind kind);
}
