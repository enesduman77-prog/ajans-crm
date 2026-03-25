package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {
    @NotBlank(message = "Mesaj içeriği zorunludur")
    @Size(max = 5000, message = "Mesaj en fazla 5000 karakter olabilir")
    private String content;

    private boolean requiresApproval;
}
