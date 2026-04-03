package com.myweb.security.xss;

import java.io.IOException;
import java.util.Set;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class XssFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        chain.doFilter(new XssRequestWrapper((HttpServletRequest) request), response);
    }

    private static class XssRequestWrapper extends HttpServletRequestWrapper {

        // Standard HTTP headers that should NOT be sanitized —
        // they are not user-input XSS vectors and sanitizing them
        // breaks request parsing (e.g. Content-Type: application/json → empty).
        private static final Set<String> SKIP_HEADERS = Set.of(
                "content-type", "content-length", "accept", "authorization",
                "host", "user-agent", "connection", "cache-control",
                "pragma", "origin", "referer", "accept-encoding",
                "accept-language", "cookie", "x-forwarded-for",
                "x-forwarded-proto", "x-requested-with", "if-none-match",
                "if-modified-since", "sec-fetch-dest", "sec-fetch-mode",
                "sec-fetch-site", "sec-ch-ua", "sec-ch-ua-mobile",
                "sec-ch-ua-platform", "upgrade-insecure-requests");

        public XssRequestWrapper(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String[] getParameterValues(String parameter) {
            String[] values = super.getParameterValues(parameter);
            if (values == null) {
                return null;
            }
            int count = values.length;
            String[] encodedValues = new String[count];
            for (int i = 0; i < count; i++) {
                encodedValues[i] = XssSanitizerUtil.sanitize(values[i]);
            }
            return encodedValues;
        }

        @Override
        public String getParameter(String parameter) {
            String value = super.getParameter(parameter);
            return XssSanitizerUtil.sanitize(value);
        }

        @Override
        public String getHeader(String name) {
            String value = super.getHeader(name);
            // Do not sanitize standard HTTP headers — only custom/user headers
            if (name != null && SKIP_HEADERS.contains(name.toLowerCase())) {
                return value;
            }
            return XssSanitizerUtil.sanitize(value);
        }
    }
}
