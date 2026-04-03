package com.myweb.config;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myweb.security.CustomOAuth2UserService;
import com.myweb.security.CustomUserDetailsService;
import com.myweb.security.HttpCookieOAuth2AuthorizationRequestRepository;
import com.myweb.security.IpBlacklistFilter;
import com.myweb.security.JwtAuthFilter;
import com.myweb.security.OAuth2LoginSuccessHandler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        private final JwtAuthFilter jwtAuthFilter;
        private final CustomOAuth2UserService customOAuth2UserService;
        private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
        private final CustomUserDetailsService customUserDetailsService;
        private final HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository;
        private final ObjectMapper objectMapper;
        private final IpBlacklistFilter ipBlacklistFilter;

        public SecurityConfig(
                        JwtAuthFilter jwtAuthFilter,
                        CustomOAuth2UserService customOAuth2UserService,
                        OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                        CustomUserDetailsService customUserDetailsService,
                        HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository,
                        ObjectMapper objectMapper,
                        IpBlacklistFilter ipBlacklistFilter) {
                this.jwtAuthFilter = jwtAuthFilter;
                this.customOAuth2UserService = customOAuth2UserService;
                this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
                this.customUserDetailsService = customUserDetailsService;
                this.cookieAuthorizationRequestRepository = cookieAuthorizationRequestRepository;
                this.objectMapper = objectMapper;
                this.ipBlacklistFilter = ipBlacklistFilter;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .headers(headers -> headers
                                                .contentSecurityPolicy(csp -> csp.policyDirectives(
                                                                "default-src 'self'; " +
                                                                                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                                                                                +
                                                                                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                                                                                +
                                                                                "font-src 'self' data: https://fonts.gstatic.com; "
                                                                                +
                                                                                "img-src 'self' data: blob: https:; " +
                                                                                // THÊM URL VERCEL VÀO CSP
                                                                                "connect-src 'self' http://localhost:5173 https://cybershield-final-chi.vercel.app https://generativelanguage.googleapis.com https://accounts.google.com https://github.com https://facebook.com; "
                                                                                +
                                                                                "frame-ancestors 'none'; " +
                                                                                "form-action 'self' https://accounts.google.com https://github.com https://facebook.com; "
                                                                                +
                                                                                "object-src 'none';")))
                                .cors(c -> c.configurationSource(corsConfigurationSource()))
                                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // CHO PHÉP ENDPOINT HEALTH
                                                .requestMatchers("/api/v1/health").permitAll()
                                                .requestMatchers("/", "/index.html", "/login.html", "/dashboard.html",
                                                                "/css/**", "/js/**", "/images/**", "/oauth2/**",
                                                                "/login/**", "/error", "/static/**", "/assets/**",
                                                                "/*.js", "/*.css", "/*.png", "/*.jpg")
                                                .permitAll()
                                                .requestMatchers("/ws/**", "/ws").permitAll()
                                                .requestMatchers("/actuator/**").hasRole("ADMIN")
                                                .requestMatchers("/swagger-ui/**", "/swagger-ui.html",
                                                                "/v3/api-docs/**", "/v3/api-docs")
                                                .permitAll()
                                                .requestMatchers("/api/auth/**").permitAll()
                                                .requestMatchers("/api/public/**").permitAll()
                                                .requestMatchers(org.springframework.http.HttpMethod.POST,
                                                                "/api/contact")
                                                .permitAll()
                                                .requestMatchers("/api/ai/chat", "/api/ai/status", "/api/ai/health")
                                                .permitAll()
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/blog/**")
                                                .permitAll()
                                                .requestMatchers("/api/lab/**").permitAll()
                                                .requestMatchers("/api/**").authenticated())
                                .oauth2Login(oauth2 -> oauth2
                                                .authorizationEndpoint(authorization -> authorization
                                                                .baseUri("/oauth2/authorization")
                                                                .authorizationRequestRepository(
                                                                                cookieAuthorizationRequestRepository))
                                                // .redirectionEndpoint(redirection -> redirection
                                                // .baseUri("/oauth2/callback/*"))
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService))
                                                .successHandler(oAuth2LoginSuccessHandler))
                                .exceptionHandling(ex -> ex
                                                .accessDeniedHandler(this::handleAccessDenied)
                                                .authenticationEntryPoint(this::handleUnauthorized))
                                .authenticationProvider(authenticationProvider())
                                .addFilterBefore(ipBlacklistFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public DaoAuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
                authProvider.setUserDetailsService(customUserDetailsService);
                authProvider.setPasswordEncoder(passwordEncoder());
                return authProvider;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
                return authConfig.getAuthenticationManager();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                // THÊM URL CỦA FRONTEND TRÊN VERCEL VÀO ĐÂY
                config.setAllowedOriginPatterns(Arrays.asList(
                                "http://localhost:5173",
                                "http://192.168.*.*:5173",
                                "http://127.0.0.1:5173",
                                "https://*.ngrok-free.app",
                                "https://*.ngrok-free.dev",
                                "https://tyler-nonexemplary-attractionally.ngrok-free.dev",
                                "https://cybershield-final-chi.vercel.app" // <- URL mới thêm
                ));
                config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }

        @SuppressWarnings("unused")
        private void handleAccessDenied(HttpServletRequest request, HttpServletResponse response,
                        org.springframework.security.access.AccessDeniedException e) throws java.io.IOException {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(objectMapper.writeValueAsString(
                                Map.of("error", "Bạn không có quyền truy cập", "status", 403)));
        }

        @SuppressWarnings("unused")
        private void handleUnauthorized(HttpServletRequest request, HttpServletResponse response,
                        org.springframework.security.core.AuthenticationException e) throws java.io.IOException {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(objectMapper.writeValueAsString(
                                Map.of("error", "Vui lòng đăng nhập", "status", 401)));
        }
}