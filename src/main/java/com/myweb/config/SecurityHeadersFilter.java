package com.myweb.config;

import java.io.IOException;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Security headers filter — adds critical HTTP security headers to every
 * response.
 * These protect against XSS, clickjacking, MIME type sniffing, and enforce
 * HTTPS.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeadersFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Prevent clickjacking — block framing from other origins
        httpResponse.setHeader("X-Frame-Options", "DENY");

        // Prevent MIME type sniffing — force browsers to honor Content-Type
        httpResponse.setHeader("X-Content-Type-Options", "nosniff");

        // Enable browser XSS protection filter (legacy, still useful for older
        // browsers)
        httpResponse.setHeader("X-XSS-Protection", "1; mode=block");

        // Referrer policy — only send origin on cross-origin requests
        httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Permissions policy — restrict access to sensitive browser APIs
        httpResponse.setHeader("Permissions-Policy",
                "camera=(), microphone=(), geolocation=(), payment=()");

        // Content Security Policy — prevent XSS, data injection attacks
        httpResponse.setHeader("Content-Security-Policy",
                "default-src 'self'; " +
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                        "font-src 'self' https://fonts.gstatic.com; " +
                        "img-src 'self' data: https:; " +
                        "connect-src 'self' http://localhost:* https://localhost:*; " +
                        "frame-ancestors 'none';");

        // Strict Transport Security — force HTTPS for 1 year (enable in production)
        // httpResponse.setHeader("Strict-Transport-Security", "max-age=31536000;
        // includeSubDomains; preload");

        // Cache control for API responses
        String requestUri = ((jakarta.servlet.http.HttpServletRequest) request).getRequestURI();
        if (requestUri.startsWith("/api/")) {
            httpResponse.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            httpResponse.setHeader("Pragma", "no-cache");
        }

        chain.doFilter(request, response);
    }
}
