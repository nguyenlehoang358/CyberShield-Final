package com.myweb.dto;

import java.util.stream.Collectors;

import com.myweb.entity.User;

public record UserResponse(
        Long id,
        String username,
        String email,
        String oauthProvider,
        String roles,
        boolean enabled,
        String createdAt) { // <-- Chú ý: Đã đổi Instant thành String

    public static UserResponse from(User user) {
        String rolesString = "CHƯA_CÓ_QUYỀN";
        
        try {
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                rolesString = user.getRoles().stream()
                        .filter(role -> role != null && role.getName() != null)
                        .map(role -> role.getName().toString())
                        .collect(Collectors.joining(", "));
            }
        } catch (Exception e) {
            rolesString = "LỖI_DATA_ROLE";
        }

        // Ép kiểu thời gian sang String an toàn
        String dateStr = user.getCreatedAt() != null ? user.getCreatedAt().toString() : "N/A";

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getOauthProvider(),
                rolesString,
                user.isEnabled(),
                dateStr); // <-- Truyền dateStr vào đây
    }
}