package com.myweb.entity;

import java.time.Instant;
import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Security Event — records security-relevant events for threat analysis.
 * Used by the AI Security Advisor to detect patterns and generate
 * recommendations.
 */
@Entity
@Table(name = "security_events")
public class SecurityEvent {

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum Source {
        APP_LOG, BRUTE_FORCE, RATE_LIMIT, AUTH, MANUAL, SYSTEM
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Source source;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Severity severity;

    @Column(name = "event_type", length = 100)
    private String eventType;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_data", columnDefinition = "JSONB")
    private Map<String, Object> rawData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_analysis", columnDefinition = "JSONB")
    private Map<String, Object> aiAnalysis;

    private Boolean resolved;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "created_at")
    private Instant createdAt;

    public SecurityEvent() {
        this.createdAt = Instant.now();
        this.resolved = false;
    }

    // Static factory methods
    public static SecurityEvent bruteForce(String ip, String description) {
        SecurityEvent e = new SecurityEvent();
        e.source = Source.BRUTE_FORCE;
        e.severity = Severity.HIGH;
        e.eventType = "BRUTE_FORCE_DETECTED";
        e.sourceIp = ip;
        e.description = description;
        return e;
    }

    public static SecurityEvent rateLimit(String ip, String description) {
        SecurityEvent e = new SecurityEvent();
        e.source = Source.RATE_LIMIT;
        e.severity = Severity.MEDIUM;
        e.eventType = "RATE_LIMIT_EXCEEDED";
        e.sourceIp = ip;
        e.description = description;
        return e;
    }

    public static SecurityEvent authFailure(String ip, String username, String reason) {
        SecurityEvent e = new SecurityEvent();
        e.source = Source.AUTH;
        e.severity = Severity.LOW;
        e.eventType = "AUTH_FAILURE";
        e.sourceIp = ip;
        e.description = "Login failure for user '" + username + "': " + reason;
        return e;
    }

    public static SecurityEvent suspiciousActivity(String ip, String description, Severity severity) {
        SecurityEvent e = new SecurityEvent();
        e.source = Source.SYSTEM;
        e.severity = severity;
        e.eventType = "SUSPICIOUS_ACTIVITY";
        e.sourceIp = ip;
        e.description = description;
        return e;
    }

    public static SecurityEvent ipBlocked(String ip, String reason) {
        SecurityEvent e = new SecurityEvent();
        e.source = Source.BRUTE_FORCE;
        e.severity = Severity.HIGH;
        e.eventType = "IP_BLOCKED";
        e.sourceIp = ip;
        e.description = "IP blocked: " + reason;
        return e;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public Source getSource() {
        return source;
    }

    public void setSource(Source source) {
        this.source = source;
    }

    public Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Severity severity) {
        this.severity = severity;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getSourceIp() {
        return sourceIp;
    }

    public void setSourceIp(String sourceIp) {
        this.sourceIp = sourceIp;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, Object> getRawData() {
        return rawData;
    }

    public void setRawData(Map<String, Object> rawData) {
        this.rawData = rawData;
    }

    public Map<String, Object> getAiAnalysis() {
        return aiAnalysis;
    }

    public void setAiAnalysis(Map<String, Object> aiAnalysis) {
        this.aiAnalysis = aiAnalysis;
    }

    public Boolean getResolved() {
        return resolved;
    }

    public void setResolved(Boolean resolved) {
        this.resolved = resolved;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
