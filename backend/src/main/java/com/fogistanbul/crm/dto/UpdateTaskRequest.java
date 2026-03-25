package com.fogistanbul.crm.dto;

import com.fogistanbul.crm.entity.enums.TaskStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateTaskRequest {
    @Size(max = 200)
    private String title;

    @Size(max = 5000)
    private String description;

    private TaskStatus status;
    private String category;
    private String priority;
}
