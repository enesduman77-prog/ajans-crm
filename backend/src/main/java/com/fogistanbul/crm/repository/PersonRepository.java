package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PersonRepository extends JpaRepository<Person, UUID> {
    List<Person> findByCompanyId(UUID companyId);
}
