package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateNoteRequest {
    private UUID companyId;

    @NotBlank
    @Size(max = 5000, message = "Not en fazla 5000 karakter olabilir")
    private String content;
}
