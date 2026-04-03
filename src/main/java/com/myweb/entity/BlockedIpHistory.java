package com.myweb.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Permanent historical record of IP blocking events.
 * Enables tracking AI Auto Blocks and Manual blocks for ML training.
 */
@Entity
@Table(name = "blocked_ip_history")
public class BlockedIpHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address", length = 45, nullable = false)
    private String ipAddress;

    @Column(name = "reason", length = 200)
    private String reason;

    @Column(name = "created_at")
    private Instant createdAt;

    public BlockedIpHistory() {
        this.createdAt = Instant.now();
    }

    public BlockedIpHistory(String ipAddress, String reason) {
        this();
        this.ipAddress = ipAddress;
        this.reason = reason;
    }

    public Long getId() {
        return id;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
