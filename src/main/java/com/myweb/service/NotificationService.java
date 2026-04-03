package com.myweb.service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.myweb.entity.SecurityEvent;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final SystemSettingService settingService;
    private final RestTemplate restTemplate;

    public NotificationService(SystemSettingService settingService) {
        this.settingService = settingService;
        this.restTemplate = new RestTemplate();
    }

    @Async
    public void sendSecurityAlert(SecurityEvent event) {
        if (event == null)
            return;

        // We only push alerts for HIGH or CRITICAL severity
        if (event.getSeverity() == SecurityEvent.Severity.LOW ||
                event.getSeverity() == SecurityEvent.Severity.MEDIUM) {
            return;
        }

        String webhookUrl = settingService.getSettingValue("alert.webhook_url", "");
        if (webhookUrl == null || webhookUrl.trim().isEmpty()) {
            return;
        }

        try {
            sendDiscordWebhook(webhookUrl, event);
        } catch (Exception e) {
            log.error("Failed to send webhook notification: {}", e.getMessage());
        }
    }

    public void sendTestWebhook() {
        String webhookUrl = settingService.getSettingValue("alert.webhook_url", "");
        if (webhookUrl == null || webhookUrl.trim().isEmpty()) {
            throw new RuntimeException("Webhook URL is not configured");
        }

        SecurityEvent testEvent = new SecurityEvent();
        testEvent.setEventType("TEST_NOTIFICATION");
        testEvent.setSeverity(SecurityEvent.Severity.CRITICAL);
        testEvent.setSourceIp("127.0.0.1");
        testEvent.setDescription("Đây là tin nhắn kiểm tra hệ thống kết nối Webhook từ CyberShield!");

        sendDiscordWebhook(webhookUrl, testEvent);
    }

    private void sendDiscordWebhook(String webhookUrl, SecurityEvent event) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String color = event.getSeverity() == SecurityEvent.Severity.CRITICAL ? "16711680" : "16753920"; // Red or
                                                                                                         // Orange
        String emoji = event.getSeverity() == SecurityEvent.Severity.CRITICAL ? "🚨" : "⚠️";

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.systemDefault());
        String formattedTime = formatter.format(Instant.now());

        Map<String, Object> embed = new HashMap<>();
        embed.put("title", emoji + " Cảnh báo An ninh hệ thống: " + event.getSeverity());
        embed.put("description", "**Sự kiện:** " + event.getEventType() + "\n**Vào lúc:** " + formattedTime);
        embed.put("color", Integer.parseInt(color));

        List<Map<String, String>> fields = List.of(
                Map.of("name", "Nguồn IP", "value", event.getSourceIp() != null ? event.getSourceIp() : "Unknown",
                        "inline", "true"),
                Map.of("name", "Chi tiết", "value", event.getDescription(), "inline", "false"));
        embed.put("fields", fields);

        Map<String, Object> payload = new HashMap<>();
        payload.put("username", "CyberShield Bot");
        payload.put("embeds", List.of(embed));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        restTemplate.postForObject(webhookUrl, request, String.class);
        log.info("Sent Discord webhook alert for event: {}", event.getEventType());
    }
}
