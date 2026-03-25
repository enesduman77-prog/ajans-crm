package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSurveyRequest {
    @NotNull(message = "Puan zorunludur")
    @Min(value = 1, message = "Puan en az 1 olmalıdır")
    @Max(value = 10, message = "Puan en fazla 10 olmalıdır")
    private Integer score;

    private String comment;
}
