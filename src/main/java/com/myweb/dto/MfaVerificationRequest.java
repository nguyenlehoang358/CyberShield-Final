package com.myweb.dto;

import jakarta.validation.constraints.NotNull;

public record MfaVerificationRequest(
        @NotNull(message = "Code is required") Integer code) {
}
