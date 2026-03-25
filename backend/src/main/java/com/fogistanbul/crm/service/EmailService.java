package com.fogistanbul.crm.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@fogistanbul.com}")
    private String fromAddress;

    @Value("${app.mail.enabled:false}")
    private boolean emailEnabled;

    @Async
    public void sendEmail(String to, String subject, String htmlContent) {
        if (!emailEnabled) {
            log.debug("Email disabled. Would send to={}, subject={}", to, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    public void sendTaskAssignedEmail(String to, String assigneeName, String taskTitle, String companyName) {
        String html = buildTemplate(
                "Yeni Görev Atandı",
                "Merhaba " + assigneeName + ",",
                "<strong>" + companyName + "</strong> şirketi için yeni bir görev atandı:",
                taskTitle,
                "Detayları CRM panelinden görebilirsiniz."
        );
        sendEmail(to, "Yeni Görev: " + taskTitle, html);
    }

    public void sendMeetingReminderEmail(String to, String userName, String meetingTitle, String meetingDate) {
        String html = buildTemplate(
                "Toplantı Hatırlatma",
                "Merhaba " + userName + ",",
                "Yaklaşan toplantınız var:",
                meetingTitle,
                "Tarih: " + meetingDate
        );
        sendEmail(to, "Toplantı Hatırlatma: " + meetingTitle, html);
    }

    public void sendApprovalRequestEmail(String to, String approverName, String requesterName, String resourceType) {
        String html = buildTemplate(
                "Onay Talebi",
                "Merhaba " + approverName + ",",
                requesterName + " tarafından yeni bir onay talebi gönderildi.",
                resourceType,
                "CRM panelinden onaylayabilir veya reddedebilirsiniz."
        );
        sendEmail(to, "Yeni Onay Talebi", html);
    }

    private String buildTemplate(String heading, String greeting, String body, String highlight, String footer) {
        return """
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111113; color: #e4e4e7; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #f97316 0%%, #b45309 100%%); padding: 24px 32px;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: white;">FOG<span style="font-weight: 400; opacity: 0.8;">istanbul</span></h1>
                </div>
                <div style="padding: 32px;">
                    <h2 style="margin: 0 0 16px; font-size: 18px; color: white;">%s</h2>
                    <p style="margin: 0 0 12px; color: #a1a1aa;">%s</p>
                    <p style="margin: 0 0 12px; color: #d4d4d8;">%s</p>
                    <div style="background: #09090b; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="margin: 0; color: #f97316; font-weight: 600;">%s</p>
                    </div>
                    <p style="margin: 16px 0 0; color: #71717a; font-size: 13px;">%s</p>
                </div>
                <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
                    <p style="margin: 0; color: #52525b; font-size: 11px;">© FOG İstanbul CRM</p>
                </div>
            </div>
            """.formatted(heading, greeting, body, highlight, footer);
    }
}
