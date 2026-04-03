package com.myweb.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Service
public class AiSecurityService {

    private static final Logger log = LoggerFactory.getLogger(AiSecurityService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.microservice.url:http://127.0.0.1:8000}")
    private String aiServiceUrl;

    public boolean isPayloadMalicious(String payload) {
        if (payload == null || payload.trim().isEmpty()) {
            return false;
        }

        try {
            String url = aiServiceUrl + "/api/ai/analyze-payload";
            Map<String, String> request = Map.of("payload", payload);

            // Send sync HTTP POST request to Python microservice
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Boolean isMalicious = (Boolean) response.getBody().get("is_malicious");
                if (Boolean.TRUE.equals(isMalicious)) {
                    log.warn("AI detected malicious payload: {}", payload);
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("Failed to reach AI microservice for payload analysis: {}", e.getMessage());
            // Fail open (or closed based on strictness) - defaulting to false during
            // downtime
        }
        return false;
    }

    public boolean isLoginAnomalous(int hourOfDay, int consecutiveFailures, int loginDurationMs) {
        try {
            String url = aiServiceUrl + "/api/ai/analyze-login";
            Map<String, Integer> request = Map.of(
                    "hour_of_day", hourOfDay,
                    "consecutive_failures", consecutiveFailures,
                    "login_duration_ms", loginDurationMs);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Boolean isAnomalous = (Boolean) response.getBody().get("is_anomalous");
                if (Boolean.TRUE.equals(isAnomalous)) {
                    log.warn("AI detected anomalous login behavior constraints!");
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("Failed to call AI microservice for login analysis: {}", e.getMessage());
        }
        return false;
    }
}
