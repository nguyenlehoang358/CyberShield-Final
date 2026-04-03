package com.myweb.config;

import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.myweb.security.xss.StringSanitizerDeserializer;

@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jsonCustomizer() {
        return builder -> {
            // XSS sanitizer module
            SimpleModule xssModule = new SimpleModule();
            xssModule.addDeserializer(String.class, new StringSanitizerDeserializer());

            // Use modulesToInstall (ADDS modules) instead of modules (REPLACES all)
            // This preserves Spring Boot's auto-configured modules
            builder.modulesToInstall(xssModule, new JavaTimeModule());

            // Serialize Instant as ISO-8601 string, not as numeric timestamp
            builder.featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        };
    }
}
