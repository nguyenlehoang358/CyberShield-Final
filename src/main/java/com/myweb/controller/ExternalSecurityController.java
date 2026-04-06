package com.myweb.controller;

import com.myweb.entity.ExternalClientSite;
import com.myweb.entity.ExternalSecurityAlert;
import com.myweb.repository.ExternalClientSiteRepository;
import com.myweb.repository.ExternalSecurityAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

/**
 * [EXTERNAL SECURITY SOC CONTROLLER - GIAO DIỆN BẢO VỆ ĐỐI TÁC]
 * Đây là đầu mối tiếp nhận thông tin từ các website khách hàng.
 */
@RestController
@RequestMapping("/api/v1/external")
@CrossOrigin("*") // Cho phép mọi website khách hàng có thể gửi báo cáo về SOC
public class ExternalSecurityController {

    @Autowired
    private ExternalClientSiteRepository siteRepository;

    @Autowired
    private ExternalSecurityAlertRepository alertRepository;

    /**
     * API TIẾP NHẬN BÁO CÁO TẤN CÔNG (PUBLIC ENDPOINT)
     * Nhận dữ liệu từ JS Agent được nhúng trên web khách hàng.
     */
    @PostMapping("/alert")
    public ResponseEntity<?> receiveExternalAlert(@RequestBody ExternalSecurityAlert incomingAlert, 
                                               @RequestParam String apiKey) {
        // [KIỂM TRA]: Website này có phải là đối tác đã đăng ký với CyberShield không?
        Optional<ExternalClientSite> siteOpt = siteRepository.findByApiKey(apiKey);
        
        if (siteOpt.isEmpty()) {
            return ResponseEntity.status(403).body("Invalid or missing API Key. External protection denied.");
        }

        ExternalClientSite site = siteOpt.get();
        
        // [GHI NHẬN]: Lưu vết cuộc tấn công vào Database của trung tâm SOC
        incomingAlert.setClientId(site.getId());
        ExternalSecurityAlert savedAlert = alertRepository.save(incomingAlert);

        // Trả về kết quả cho Agent phía Client biết là chúng ta đã nhận cảnh báo
        return ResponseEntity.ok("External Alert Registered successfully at CyberShield SOC!");
    }

    /**
     * API LẤY TOÀN BỘ CẢNH BÁO MỚI NHẤT (ADMIN CHỈ ĐỊNH)
     * Dùng để phục vụ hiển thị trên Dashboard Dashboard.
     */
    @GetMapping("/alerts")
    public ResponseEntity<List<ExternalSecurityAlert>> getGlobalExternalAlerts() {
        return ResponseEntity.ok(alertRepository.findTop50ByOrderByTimestampDesc());
    }

    /**
     * API TẠO MỚI MỘT WEBSITE ĐỐI TÁC (TẠO API KEY)
     * Admin sẽ dùng cái này để cấp phép bảo vệ cho một web mới.
     */
    @PostMapping("/manage/register-site")
    public ResponseEntity<ExternalClientSite> registerPartnerSite(@RequestBody ExternalClientSite site) {
        return ResponseEntity.ok(siteRepository.save(site));
    }
}
