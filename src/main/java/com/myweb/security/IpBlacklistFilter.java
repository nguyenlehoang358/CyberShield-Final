package com.myweb.security;

import java.io.IOException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class IpBlacklistFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(IpBlacklistFilter.class);

    // Inject service/repository kiểm tra IP blacklist của bạn ở đây
    // Ví dụ: private final IpBlacklistService ipBlacklistService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // FIX: Bỏ qua OPTIONS preflight — giống JwtAuthFilter
        // Nếu chặn OPTIONS, browser sẽ không nhận được CORS header → lỗi ngay từ đầu
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);

        // Kiểm tra IP có trong blacklist không
        if (isIpBlacklisted(clientIp)) {
            LOGGER.warn("Blocked request from blacklisted IP: {}", clientIp);
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(
                    Map.of("error", "Truy cập bị từ chối", "status", 403)));
            return; // Dừng lại, không đi tiếp filter chain
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Lấy IP thực của client, xử lý trường hợp đứng sau reverse proxy (Render dùng
     * proxy)
     * Header X-Forwarded-For chứa IP gốc khi qua proxy
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            // X-Forwarded-For có thể là danh sách: "client, proxy1, proxy2"
            // IP đầu tiên là IP thật của client
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }

        return request.getRemoteAddr();
    }

    /**
     * Logic kiểm tra IP blacklist — thay thế bằng implementation thực tế của bạn
     * Ví dụ: query database, check Redis cache, v.v.
     */
    private boolean isIpBlacklisted(String ip) {
        // TODO: Thay thế bằng logic thực tế
        // return ipBlacklistService.isBlocked(ip);
        return false;
    }
}