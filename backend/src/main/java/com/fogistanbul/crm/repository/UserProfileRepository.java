package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM UserProfile u WHERE u.id <> :userId AND u.globalRole <> :excludedRole")
    List<UserProfile> findContactsExcludingRole(@Param("userId") UUID userId, @Param("excludedRole") GlobalRole excludedRole);

    List<UserProfile> findByIdNot(UUID userId);

    long countByGlobalRole(GlobalRole role);

    List<UserProfile> findByGlobalRole(GlobalRole role);
}
