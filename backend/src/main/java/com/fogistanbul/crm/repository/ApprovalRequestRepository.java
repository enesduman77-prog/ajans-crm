package com.fogistanbul.crm.repository;

import com.fogistanbul.crm.entity.ApprovalRequest;
import com.fogistanbul.crm.entity.enums.RequestStatus;
import com.fogistanbul.crm.entity.enums.RequestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, UUID> {
    List<ApprovalRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);
    List<ApprovalRequest> findByCompanyIdAndStatusOrderByCreatedAtDesc(UUID companyId, RequestStatus status);
    List<ApprovalRequest> findAllByOrderByCreatedAtDesc();
    Optional<ApprovalRequest> findByReferenceIdAndTypeAndStatus(UUID referenceId, RequestType type, RequestStatus status);
    long countByStatus(RequestStatus status);
}
