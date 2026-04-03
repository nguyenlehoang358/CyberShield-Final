package com.myweb.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // Đã xóa hàm addCorsMappings để nhường quyền cho SecurityConfig
}