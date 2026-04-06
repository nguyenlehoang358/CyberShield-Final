package com.myweb.config;

import com.myweb.entity.ExternalClientSite;
import com.myweb.repository.ExternalClientSiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * [EXTERNAL SECURITY SOC - MÔ PHỎNG DỮ LIỆU]
 * Tự động tạo dữ liệu demo cho website khách hàng khi hệ thống khởi chạy lần đầu.
 */
@Component
public class ExternalDataSeeder implements CommandLineRunner {

    @Autowired
    private ExternalClientSiteRepository repository;

    @Override
    public void run(String... args) throws Exception {
        // Nếu chưa có website nào trong hệ thống, hãy tạo một bản ghi demo
        if (repository.count() == 0) {
            ExternalClientSite demoSite = new ExternalClientSite();
            demoSite.setSiteName("BTEC HND Demo Partner (Lab 1)");
            demoSite.setSiteUrl("http://localhost:3000"); // Hoặc link dự án FE cơ bản của bạn
            demoSite.setApiKey("demo-key-123"); // Đây là chìa khóa dùng để nhúng Shield Agent
            
            repository.save(demoSite);
            System.out.println("[CyberShield SOC] SEEDER: Registered Demo Partner Site. API KEY: demo-key-123");
        }
    }
}
