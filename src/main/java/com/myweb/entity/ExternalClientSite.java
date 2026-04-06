package com.myweb.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * [CYBERSHIELD SHIELD AGENT - BẢO VỆ WEB ĐỐI TÁC]
 * KHÔNG DÙNG LOMBOK ĐỂ ĐẢM BẢO BUILD ỔN ĐỊNH.
 */
@Entity
@Table(name = "external_client_sites")
public class ExternalClientSite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String siteName;

    @Column(nullable = false)
    private String siteUrl;

    @Column(nullable = false, unique = true)
    private String apiKey;

    private boolean active = true;

    private LocalDateTime createdAt;

    public ExternalClientSite() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.apiKey == null) {
            this.apiKey = UUID.randomUUID().toString();
        }
    }

    // --- GETTERS & SETTERS THỦ CÔNG ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }

    public String getSiteUrl() { return siteUrl; }
    public void setSiteUrl(String siteUrl) { this.siteUrl = siteUrl; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
