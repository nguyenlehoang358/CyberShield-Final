package com.myweb.security;

import java.io.IOException;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.myweb.entity.User;
import com.myweb.repository.UserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public OAuth2LoginSuccessHandler(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");

        if (email == null || email.isEmpty()) {
            if (oauth2User.getAttribute("login") != null) {
                email = oauth2User.getAttribute("login") + "@github.com";
            } else if (oauth2User.getAttribute("id") != null) {
                email = oauth2User.getAttribute("id") + "@facebook.com";
            } else {
                email = oauth2User.getName() + "@social.com";
            }
        }

        // --- PHÂN BIỆT LUỒNG: LIÊN KẾT vs ĐĂNG NHẬP ---
        boolean isLinkFlow = false;
        String linkToken = null;
        jakarta.servlet.http.Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (jakarta.servlet.http.Cookie c : cookies) {
                if ("link_access_token".equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                    linkToken = c.getValue();
                    if (jwtUtil.validateToken(linkToken)) {
                        isLinkFlow = true;
                    }
                    break;
                }
            }
        }

        // Xóa cookie tạm sau khi đọc xong
        jakarta.servlet.http.Cookie clearCookie = new jakarta.servlet.http.Cookie("link_access_token", "");
        clearCookie.setPath("/");
        clearCookie.setMaxAge(0);
        response.addCookie(clearCookie);

        // --- LUỒNG LIÊN KẾT: Redirect về /profile ---
        if (isLinkFlow && linkToken != null) {
            // User đã tồn tại, chỉ cần trả về profile với token cũ
            org.springframework.http.ResponseCookie springCookie = org.springframework.http.ResponseCookie
                    .from("jwt", linkToken)
                    .httpOnly(true).secure(true).path("/").sameSite("None").maxAge(86400).build();
            response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, springCookie.toString());
            response.sendRedirect("http://localhost:5173/oauth2/redirect?token=" + linkToken + "&linked=true");
            return;
        }

        // --- LUỒNG ĐĂNG NHẬP THÔNG THƯỜNG ---
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            String rolesStr = "ROLE_USER";
            try {
                if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                    rolesStr = user.getRoles().stream()
                            .filter(role -> role != null && role.getName() != null)
                            .map(role -> role.getName().name())
                            .collect(Collectors.joining(","));
                }
            } catch (Exception e) {
                System.err.println("Lỗi parse role trong OAuth2: " + e.getMessage());
            }

            String token = jwtUtil.generateToken(user.getUsername(), user.getEmail(), rolesStr);

            org.springframework.http.ResponseCookie springCookie = org.springframework.http.ResponseCookie
                    .from("jwt", token)
                    .httpOnly(true).secure(true).path("/").sameSite("None").maxAge(86400).build();
            response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, springCookie.toString());

            response.sendRedirect("http://localhost:5173/oauth2/redirect?token=" + token);
        } else {
            response.sendRedirect("http://localhost:5173/login?error=oauth_user_not_found");
        }
    }
}