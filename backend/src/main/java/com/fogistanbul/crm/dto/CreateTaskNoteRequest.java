package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTaskNoteRequest {
    @NotBlank(message = "Not içeriği boş olamaz")
    private String content;
}
