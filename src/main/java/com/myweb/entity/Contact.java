package com.myweb.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

@Entity
@Table(name = "contacts")
public class Contact {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tên không được để trống")
    @Column(length = 100)
    private String name;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Column(length = 150)
    private String email;

    @NotBlank(message = "Tin nhắn không được để trống")
    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "is_read")
    private Boolean isRead = false;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Boolean getIsRead() { return isRead != null ? isRead : false; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
}
