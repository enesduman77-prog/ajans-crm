package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.entity.Meeting;
import com.fogistanbul.crm.entity.Shoot;
import com.fogistanbul.crm.entity.Task;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.MeetingRepository;
import com.fogistanbul.crm.repository.ShootRepository;
import com.fogistanbul.crm.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarExportController {

    private final MeetingRepository meetingRepository;
    private final ShootRepository shootRepository;
    private final TaskRepository taskRepository;
    private final CompanyMembershipRepository membershipRepository;

    private static final DateTimeFormatter ICAL_DT = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")
            .withZone(ZoneId.of("UTC"));

    @GetMapping("/export.ics")
    public ResponseEntity<String> exportCalendar(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("AGENCY_STAFF");

        List<Meeting> meetings;
        List<Shoot> shoots;
        List<Task> tasks;

        if ("ADMIN".equals(role)) {
            meetings = meetingRepository.findAll();
            shoots = shootRepository.findAll();
            tasks = taskRepository.findAll();
        } else {
            List<UUID> companyIds = membershipRepository.findCompanyIdsByUserId(userId);
            if (companyIds.isEmpty()) {
                meetings = List.of();
                shoots = List.of();
                tasks = List.of();
            } else {
                meetings = meetingRepository.findByCompanyIdIn(companyIds);
                shoots = shootRepository.findByCompanyIdIn(companyIds);
                tasks = taskRepository.findByCompanyIdIn(companyIds);
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//FOG Istanbul CRM//TR\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:PUBLISH\r\n");

        for (Meeting m : meetings) {
            if (m.getMeetingDate() == null) {
                continue;
            }
            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:meeting-").append(m.getId()).append("@fogistanbul.com\r\n");
            sb.append("DTSTART:").append(ICAL_DT.format(m.getMeetingDate())).append("\r\n");
            if (m.getDurationMinutes() != null) {
                Instant endTime = m.getMeetingDate().plusSeconds(m.getDurationMinutes() * 60L);
                sb.append("DTEND:").append(ICAL_DT.format(endTime)).append("\r\n");
            }
            sb.append("SUMMARY:").append(escapeIcal(m.getTitle())).append("\r\n");
            if (m.getLocation() != null) {
                sb.append("LOCATION:").append(escapeIcal(m.getLocation())).append("\r\n");
            }
            if (m.getDescription() != null) {
                sb.append("DESCRIPTION:").append(escapeIcal(m.getDescription())).append("\r\n");
            }
            sb.append("STATUS:").append(m.getStatus().name()).append("\r\n");
            sb.append("END:VEVENT\r\n");
        }

        for (Shoot s : shoots) {
            if (s.getShootDate() == null) {
                continue;
            }
            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:shoot-").append(s.getId()).append("@fogistanbul.com\r\n");
            sb.append("DTSTART:").append(ICAL_DT.format(s.getShootDate())).append("\r\n");
            sb.append("SUMMARY:Shoot ").append(escapeIcal(s.getTitle())).append("\r\n");
            if (s.getLocation() != null) {
                sb.append("LOCATION:").append(escapeIcal(s.getLocation())).append("\r\n");
            }
            sb.append("END:VEVENT\r\n");
        }

        for (Task t : tasks) {
            if (t.getStartDate() == null && t.getEndDate() == null) {
                continue;
            }
            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:task-").append(t.getId()).append("@fogistanbul.com\r\n");
            if (t.getStartDate() != null) {
                sb.append("DTSTART:").append(ICAL_DT.format(t.getStartDate())).append("\r\n");
            }
            if (t.getEndDate() != null) {
                sb.append("DTEND:").append(ICAL_DT.format(t.getEndDate())).append("\r\n");
            }
            sb.append("SUMMARY:Task ").append(escapeIcal(t.getTitle())).append("\r\n");
            if (t.getDescription() != null) {
                sb.append("DESCRIPTION:").append(escapeIcal(t.getDescription())).append("\r\n");
            }
            sb.append("END:VEVENT\r\n");
        }

        sb.append("END:VCALENDAR\r\n");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/calendar"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"fog-calendar.ics\"")
                .body(sb.toString());
    }

    private String escapeIcal(String text) {
        return text.replace("\\", "\\\\")
                .replace(",", "\\,")
                .replace(";", "\\;")
                .replace("\n", "\\n");
    }
}
