package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateNotificationPreferenceRequest {
    @NotBlank
    private String notificationType;
    private boolean inApp;
    private boolean email;
}
