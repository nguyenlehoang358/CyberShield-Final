package com.myweb.config;

import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import com.myweb.dto.ApiErrorResponse;
import com.myweb.entity.AuditLog;
import com.myweb.entity.SecurityEvent;
import com.myweb.repository.AuditLogRepository;
import com.myweb.service.SecurityEventService;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Global Exception Handler — centralizes all error handling across the
 * application.
 * Returns consistent ApiErrorResponse JSON for all error types.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final AuditLogRepository auditLogRepository;
    private final SecurityEventService securityEventService;
    private final com.myweb.service.SystemSettingService systemSettingService;

    public GlobalExceptionHandler(AuditLogRepository auditLogRepository,
            SecurityEventService securityEventService,
            com.myweb.service.SystemSettingService systemSettingService) {
        this.auditLogRepository = auditLogRepository;
        this.securityEventService = securityEventService;
        this.systemSettingService = systemSettingService;
    }

    private void saveAuditLog(AuditLog log) {
        String level = systemSettingService.getSettingValue("general.log_level", "ALL");
        if ("DANGER_ONLY".equals(level) && log.getSeverity() != AuditLog.Severity.DANGER) {
            return;
        }
        auditLogRepository.save(log);
    }

    // ── Authentication / Authorization ──────────────────────────────────────────

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException ex,
            HttpServletRequest request) {
        String ip = getClientIp(request);
        log.warn("Bad credentials attempt from IP: {}", ip);

        saveAuditLog(new AuditLog(
                "LOGIN_FAILED",
                "unknown",
                ip,
                "Bad credentials",
                AuditLog.Severity.DANGER));

        return buildResponse(HttpStatus.UNAUTHORIZED, "Authentication Failed",
                "Invalid email or password", request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuth(AuthenticationException ex, HttpServletRequest request) {
        log.warn("Auth exception: {}", ex.getMessage());
        return buildResponse(HttpStatus.UNAUTHORIZED, "Unauthorized",
                "Please login to access this resource", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        String ip = getClientIp(request);
        log.warn("Access denied for IP: {} on path: {}", ip, request.getRequestURI());

        saveAuditLog(new AuditLog(
                "ACCESS_DENIED",
                request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous",
                ip,
                "Path: " + request.getRequestURI(),
                AuditLog.Severity.WARN));

        // Log to security events for AI analysis
        securityEventService.logSuspicious(ip,
                "Access denied: " + request.getRequestURI(),
                SecurityEvent.Severity.MEDIUM);

        return buildResponse(HttpStatus.FORBIDDEN, "Access Denied",
                "You do not have permission to access this resource", request);
    }

    // ── Validation ──────────────────────────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Error", message, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArg(IllegalArgumentException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParam(MissingServletRequestParameterException ex,
            HttpServletRequest request) {
        String message = "Missing required parameter: " + ex.getParameterName();
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request", message, request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {
        Class<?> requiredType = ex.getRequiredType();
        String typeName = requiredType != null ? requiredType.getSimpleName() : "unknown";
        String message = "Parameter '" + ex.getName() + "' should be of type " + typeName;
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request", message, request);
    }

    // ── Not Found / Method Not Allowed ──────────────────────────────────────────

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(NoHandlerFoundException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, "Not Found",
                "The requested resource was not found", request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request) {
        return buildResponse(HttpStatus.METHOD_NOT_ALLOWED, "Method Not Allowed",
                "HTTP method '" + ex.getMethod() + "' is not supported for this endpoint", request);
    }

    // ── Runtime / Catch-All ─────────────────────────────────────────────────────

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiErrorResponse> handleRuntime(RuntimeException ex, HttpServletRequest request) {
        log.error("Unhandled runtime exception on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        try {
            java.nio.file.Files.writeString(java.nio.file.Path.of("error.log"), ex.toString() + "\n" + java.util.Arrays.toString(ex.getStackTrace()));
        } catch (Exception e) {}
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "An unexpected error occurred. Please try again later.", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneral(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "An unexpected error occurred. Please try again later.", request);
    }

    // ── Utility ─────────────────────────────────────────────────────────────────

    private ResponseEntity<ApiErrorResponse> buildResponse(HttpStatus status, String error, String message,
            HttpServletRequest request) {
        ApiErrorResponse body = new ApiErrorResponse(
                status.value(), error, message, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
