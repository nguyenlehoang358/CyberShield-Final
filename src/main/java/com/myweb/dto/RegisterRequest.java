package com.myweb.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Username không được để trống") @Size(min = 3, max = 50, message = "Username từ 3 đến 50 ký tự") @Pattern(regexp = "^[a-zA-Z0-9_-]{3,50}$", message = "Username chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới (Chống XSS)") String username,

        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,

        @NotBlank(message = "Mật khẩu không được để trống") @Size(min = 8, max = 128, message = "Mật khẩu từ 8 đến 128 ký tự") @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$", message = "Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số") String password,

        @Pattern(regexp = "^[0-9]{10,15}$", message = "Số điện thoại chỉ được chứa 10-15 chữ số") String phoneNumber) {
}
