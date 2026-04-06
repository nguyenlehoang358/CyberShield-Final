package com.myweb.controller;

import com.myweb.entity.ExternalClientSite;
import com.myweb.entity.ExternalSecurityAlert;
import com.myweb.repository.ExternalClientSiteRepository;
import com.myweb.repository.ExternalSecurityAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

/**
 * [EXTERNAL SECURITY SOC CONTROLLER - GIAO DIỆN BẢO VỆ ĐỐI TÁC]
 * Đây là đầu mối tiếp nhận thông tin từ các website khách hàng.
 */
@RestController
@RequestMapping("/api/v1/external")
@CrossOrigin("*") 
public class ExternalSecurityController {

    @Autowired
    private ExternalClientSiteRepository siteRepository;

    @Autowired
    private ExternalSecurityAlertRepository alertRepository;

    /**
     * API TIẾP NHẬN BÁO CÁO TẤN CÔNG (PUBLIC ENDPOINT)
     */
    @PostMapping("/alert")
    public ResponseEntity<?> receiveExternalAlert(@RequestBody ExternalSecurityAlert incomingAlert, 
                                               @RequestParam String apiKey) {
        Optional<ExternalClientSite> siteOpt = siteRepository.findByApiKey(apiKey);
        
        if (siteOpt.isEmpty()) {
            return ResponseEntity.status(403).body("Invalid or missing API Key.");
        }

        ExternalClientSite site = siteOpt.get();
        incomingAlert.setClientId(site.getId());
        alertRepository.save(incomingAlert);

        return ResponseEntity.ok("External Alert Registered successfully!");
    }

    /**
     * [SOC ADMIN ONLY] - Lấy danh sách tất cả cảnh báo từ xa (Mới nhất lên đầu)
     */
    @GetMapping("/alerts")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ExternalSecurityAlert> getAllAlerts() {
        return alertRepository.findAllOrderByTimestampDesc();
    }

    /**
     * API TẠO MỚI MỘT WEBSITE ĐỐI TÁC
     */
    @PostMapping("/manage/register-site")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ExternalClientSite> registerPartnerSite(@RequestBody ExternalClientSite site) {
        return ResponseEntity.ok(siteRepository.save(site));
    }
}
