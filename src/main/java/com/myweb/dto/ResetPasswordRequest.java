package com.myweb.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,

        @NotBlank(message = "Mật khẩu mới không được để trống") @Size(min = 8, max = 128, message = "Mật khẩu từ 8 đến 128 ký tự") String newPassword,

        String verificationCode) {
}
