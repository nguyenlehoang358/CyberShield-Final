package com.myweb.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * [CYBERSHIELD SHIELD AGENT - CẢNH BÁO TỪ XA]
 * LƯU TRỮ CẢNH BÁO - NO LOMBOK
 */
@Entity
@Table(name = "external_security_alerts")
public class ExternalSecurityAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    @Column(nullable = false)
    private String attackType;

    @Column(columnDefinition = "TEXT")
    private String payload;

    private String attackerIp;

    private String targetPath;

    private LocalDateTime timestamp;

    public ExternalSecurityAlert() {}

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }

    // --- GETTERS & SETTERS THỦ CÔNG ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getAttackType() { return attackType; }
    public void setAttackType(String attackType) { this.attackType = attackType; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public String getAttackerIp() { return attackerIp; }
    public void setAttackerIp(String attackerIp) { this.attackerIp = attackerIp; }

    public String getTargetPath() { return targetPath; }
    public void setTargetPath(String targetPath) { this.targetPath = targetPath; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
