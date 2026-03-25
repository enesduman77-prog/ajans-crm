package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.CreateTaskReviewRequest;
import com.fogistanbul.crm.dto.TaskReviewResponse;
import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.entity.TaskReview;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.entity.enums.GlobalRole;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.TaskRepository;
import com.fogistanbul.crm.repository.TaskReviewRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskReviewService {

    private final TaskReviewRepository reviewRepository;
    private final TaskRepository taskRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompanyMembershipRepository membershipRepository;

    @Transactional
    public TaskReviewResponse createReview(CreateTaskReviewRequest req, UUID reviewerId) {
        Task task = taskRepository.findById(req.getTaskId())
                .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));

        UserProfile reviewer = userProfileRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));
        ensureTaskAccess(task, reviewer);

        if (reviewRepository.existsByTaskIdAndReviewerId(req.getTaskId(), reviewerId)) {
            throw new RuntimeException("Bu gorev icin zaten puanlama yapilmis");
        }

        TaskReview review = TaskReview.builder()
                .task(task)
                .reviewer(reviewer)
                .score(req.getScore())
                .comment(req.getComment())
                .build();

        review = reviewRepository.save(review);
        log.info("Task review created for task {} by user {}", task.getTitle(), reviewer.getEmail());
        return toResponse(review);
    }

    @Transactional(readOnly = true)
    public List<TaskReviewResponse> getReviewsByTask(UUID taskId, UUID requesterId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Gorev bulunamadi"));
        UserProfile requester = userProfileRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Kullanici bulunamadi"));
        ensureTaskAccess(task, requester);

        return reviewRepository.findByTaskId(taskId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void ensureTaskAccess(Task task, UserProfile user) {
        if (user.getGlobalRole() == GlobalRole.ADMIN) {
            return;
        }
        UUID companyId = task.getCompany().getId();
        if (!membershipRepository.existsByUserIdAndCompanyId(user.getId(), companyId)) {
            throw new RuntimeException("Bu goreve erisim yetkiniz yok");
        }
    }

    private TaskReviewResponse toResponse(TaskReview review) {
        return TaskReviewResponse.builder()
                .id(review.getId())
                .taskId(review.getTask().getId())
                .taskTitle(review.getTask().getTitle())
                .reviewerId(review.getReviewer().getId())
                .reviewerName(review.getReviewer().getPerson() != null
                        ? review.getReviewer().getPerson().getFullName()
                        : review.getReviewer().getEmail())
                .score(review.getScore())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
