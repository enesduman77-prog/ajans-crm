package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationPreferenceResponse {
    private String notificationType;
    private boolean inApp;
    private boolean email;
}
