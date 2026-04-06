package com.myweb.repository;

import com.myweb.entity.ExternalSecurityAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExternalSecurityAlertRepository extends JpaRepository<ExternalSecurityAlert, Long> {
    
    // Tìm kiếm các cảnh báo của một client cụ thể
    List<ExternalSecurityAlert> findByClientId(Long clientId);

    // LẤY TẤT CẢ CẢNH BÁO - MỚI NHẤT LÊN ĐẦU (Dành cho SOC REALTIME)
    @Query("SELECT a FROM ExternalSecurityAlert a ORDER BY a.timestamp DESC")
    List<ExternalSecurityAlert> findAllOrderByTimestampDesc();
}
