package com.myweb.dto;

import java.util.List;

public record AuthResponse(
        String token,
        String username,
        String email,
        List<String> roles,
        boolean mfaEnabled,
        boolean mfaRequired,
        String message) {
}
