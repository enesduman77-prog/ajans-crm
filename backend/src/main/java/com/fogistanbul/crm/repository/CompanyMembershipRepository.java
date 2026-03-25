package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.CompanyMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyMembershipRepository extends JpaRepository<CompanyMembership, UUID> {
    List<CompanyMembership> findByUserId(UUID userId);

    List<CompanyMembership> findByCompanyId(UUID companyId);

    @Query("SELECT m FROM CompanyMembership m JOIN FETCH m.user u LEFT JOIN FETCH u.person JOIN FETCH m.company WHERE m.company.id = :companyId")
    List<CompanyMembership> findByCompanyIdWithDetails(@Param("companyId") UUID companyId);

    Optional<CompanyMembership> findByUserIdAndCompanyId(UUID userId, UUID companyId);

    boolean existsByUserIdAndCompanyId(UUID userId, UUID companyId);

    long countByCompanyId(UUID companyId);

    @Query("SELECT m.company.id FROM CompanyMembership m WHERE m.user.id = :userId")
    List<UUID> findCompanyIdsByUserId(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT m.user.id FROM CompanyMembership m WHERE m.company.id IN :companyIds")
    List<UUID> findDistinctUserIdsByCompanyIds(@Param("companyIds") List<UUID> companyIds);

    @Query("""
            SELECT CASE WHEN COUNT(m1) > 0 THEN true ELSE false END
            FROM CompanyMembership m1
            WHERE m1.user.id = :userId
              AND m1.company.id IN (
                  SELECT m2.company.id FROM CompanyMembership m2 WHERE m2.user.id = :targetUserId
              )
            """)
    boolean existsSharedCompany(@Param("userId") UUID userId, @Param("targetUserId") UUID targetUserId);

    @Query("SELECT DISTINCT m.user.id FROM CompanyMembership m WHERE m.company.id IN :companyIds AND m.membershipRole = com.fogistanbul.crm.entity.enums.MembershipRole.AGENCY_STAFF")
    List<UUID> findAgencyStaffUserIdsByCompanyIds(@Param("companyIds") List<UUID> companyIds);

    List<CompanyMembership> findByUserIdIn(List<UUID> userIds);
}
