package com.myweb.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "blogs")
public class Blog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;           

    @Column(nullable = false, unique = true, length = 500)
    private String url;               

    @Column(name = "image_url", length = 1000)
    private String imageUrl;          

    @Column(name = "published_at")
    private Instant publishedAt;      

    @Column(name = "published")
    private Boolean published = true;
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
    public Boolean getPublished() { return published != null ? published : true; }
    public void setPublished(Boolean published) { this.published = published; }
}
