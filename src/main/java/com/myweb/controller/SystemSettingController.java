package com.myweb.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.myweb.entity.SystemSetting;
import com.myweb.service.NotificationService;
import com.myweb.service.SystemSettingService;

@RestController
@RequestMapping("/api/admin/settings")
public class SystemSettingController {

    private final SystemSettingService systemSettingService;
    private final NotificationService notificationService;

    public SystemSettingController(SystemSettingService systemSettingService, NotificationService notificationService) {
        this.systemSettingService = systemSettingService;
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SystemSetting>> getAllSettings() {
        return ResponseEntity.ok(systemSettingService.getAllSettings());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateSettings(@RequestBody Map<String, String> updates) {
        systemSettingService.updateSettings(updates);
        return ResponseEntity.ok("Settings updated successfully");
    }

    @PostMapping("/test-webhook")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> testWebhook() {
        notificationService.sendTestWebhook();
        return ResponseEntity.ok("Test notification sent to Webhook");
    }
}
