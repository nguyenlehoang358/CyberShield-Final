package com.myweb.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration using STOMP over SockJS.
 *
 * Endpoints:
 * /ws — Main WebSocket connection point
 *
 * Destinations:
 * /app/** — Client-to-server messages (AI chat input)
 * /topic/** — Broadcast messages (security alerts to all admins)
 * /queue/** — Private messages (AI chat responses to specific user)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple in-memory broker for /topic (broadcast) and /queue (private)
        registry.enableSimpleBroker("/topic", "/queue");
        // Client messages prefixed with /app will be routed to @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
        // User-specific messages prefix
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Main WebSocket endpoint — SockJS fallback for older browsers
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
