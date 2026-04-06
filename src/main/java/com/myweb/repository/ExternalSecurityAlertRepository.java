package com.myweb.repository;

import com.myweb.entity.ExternalSecurityAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Repository lưu nhật ký tấn công từ mạng xã hội/web ngoài.
 * Dùng để hiển thị thống kê trên Dashboard SOC cho Admin quản trị.
 */
public interface ExternalSecurityAlertRepository extends JpaRepository<ExternalSecurityAlert, Long> {
    
    /** Tìm toàn bộ nhật ký tấn công của một website cụ thể (ClientId) */
    List<ExternalSecurityAlert> findByClientIdOrderByTimestampDesc(Long clientId);
    
    /** Lấy danh sách nhật ký mới nhất trình diễn trên Dashboard Dashboard */
    List<ExternalSecurityAlert> findTop50ByOrderByTimestampDesc();
}
