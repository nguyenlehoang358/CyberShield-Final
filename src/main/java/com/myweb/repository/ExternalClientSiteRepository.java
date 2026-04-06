package com.myweb.repository;

import com.myweb.entity.ExternalClientSite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Repository để truy xuất thông tin website đối tác.
 * Dùng để kiểm tra API Key từ Client gửi về.
 */
public interface ExternalClientSiteRepository extends JpaRepository<ExternalClientSite, Long> {
    Optional<ExternalClientSite> findByApiKey(String apiKey);
}
