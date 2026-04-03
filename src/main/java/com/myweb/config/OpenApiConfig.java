package com.myweb.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI / Swagger Configuration.
 * Access the docs at: http://localhost:8080/swagger-ui.html
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MyWeb Cybersecurity API")
                        .version("1.0.0")
                        .description("""
                                RESTful API for MyWeb Cybersecurity Platform.

                                ## Authentication
                                Most endpoints require a valid JWT token. Use the `/api/auth/login` endpoint
                                to obtain a token, then click **Authorize** and enter: `Bearer <your-token>`.

                                ## Features
                                - User authentication (JWT + OAuth2)
                                - Multi-Factor Authentication (TOTP)
                                - Admin dashboard & user management
                                - Cybersecurity labs
                                """)
                        .contact(new Contact()
                                .name("MyWeb Team")
                                .email("admin@myweb.com"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Development Server")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT token")));
    }
}
