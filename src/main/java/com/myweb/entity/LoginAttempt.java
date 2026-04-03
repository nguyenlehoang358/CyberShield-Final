package com.myweb.entity;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Records every login attempt (success or failure) for security auditing.
 * Used by the Brute Force Protection system and Admin Security Dashboard.
 */
@Entity
@Table(name = "login_attempts")
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(length = 255)
    private String username;

    private Boolean success;

    @Column(name = "failure_reason", length = 200)
    private String failureReason;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "geo_country", length = 100)
    private String geoCountry;

    @Column(name = "geo_city", length = 100)
    private String geoCity;

    @Column(name = "created_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant createdAt;

    

    public LoginAttempt() {
        this.createdAt = Instant.now();
    }

    // Static factory methods for readable code
    public static LoginAttempt success(String ip, String username, String userAgent) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.ipAddress = ip;
        attempt.username = username;
        attempt.success = true;
        attempt.userAgent = userAgent;
        return attempt;
    }

    public static LoginAttempt failure(String ip, String username, String reason, String userAgent) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.ipAddress = ip;
        attempt.username = username;
        attempt.success = false;
        attempt.failureReason = reason;
        attempt.userAgent = userAgent;
        return attempt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getGeoCountry() {
        return geoCountry;
    }

    public void setGeoCountry(String geoCountry) {
        this.geoCountry = geoCountry;
    }

    public String getGeoCity() {
        return geoCity;
    }

    public void setGeoCity(String geoCity) {
        this.geoCity = geoCity;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
