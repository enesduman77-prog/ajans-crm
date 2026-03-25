package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateTaskReviewRequest {
    @NotNull
    private UUID taskId;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer score;

    @Size(max = 2000)
    private String comment;
}
