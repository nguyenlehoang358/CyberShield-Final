package com.myweb.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.myweb.config.CyberShieldDefaultsConfig;
import com.myweb.entity.SystemSetting;
import com.myweb.repository.SystemSettingRepository;

@Service
public class SystemSettingService {

        private static final Logger log = LoggerFactory.getLogger(SystemSettingService.class);

        private final SystemSettingRepository systemSettingRepository;
        private final CyberShieldDefaultsConfig defaults;

        public SystemSettingService(SystemSettingRepository systemSettingRepository,
                        CyberShieldDefaultsConfig defaults) {
                this.systemSettingRepository = systemSettingRepository;
                this.defaults = defaults;
        }

        /**
         * Khởi tạo giá trị mặc định từ application.yml khi database trống.
         * Source of Truth: cybershield.defaults.* trong application.yml
         */
        public void initializeDefaults() {
                if (systemSettingRepository.count() > 0) {
                        return; // Đã có dữ liệu, không cần seed
                }

                log.info("🚀 Database trống — Đang khởi tạo Settings mặc định từ application.yml...");

                // ── Tab 1: General System ──
                save("general.maintenance_mode",
                                String.valueOf(defaults.getGeneral().isMaintenanceMode()),
                                "GENERAL", "Bật chế độ bảo trì toàn hệ thống");

                save("general.log_level",
                                defaults.getGeneral().getLogLevel(),
                                "GENERAL", "Mức độ lưu lỗi (ALL, DANGER_ONLY)");

                save("general.default_lang",
                                defaults.getGeneral().getDefaultLang(),
                                "GENERAL", "Ngôn ngữ giao diện mặc định");

                // ── Tab 2: Defense Firewall ──
                save("defense.auto_ban_threshold",
                                String.valueOf(defaults.getDefense().getAutoBanThreshold()),
                                "DEFENSE", "Số lần đăng nhập sai tối đa trước khi khoá");

                save("defense.block_duration_minutes",
                                String.valueOf(defaults.getDefense().getBlockDurationMinutes()),
                                "DEFENSE", "Thời gian khóa mặc định (phút)");

                save("defense.ip_whitelist",
                                defaults.getDefense().getIpWhitelist(),
                                "DEFENSE", "Danh sách IP bỏ qua kiểm duyệt (cách nhau bởi dấu phẩy)");

                // ── Tab 3: AI & Automation ──
                save("ai.sensitivity",
                                defaults.getAi().getSensitivity(),
                                "AI", "Độ nhạy phân tích (LOW, MEDIUM, HIGH)");

                save("ai.ollama_url",
                                defaults.getAi().getOllamaUrl(),
                                "AI", "URL máy chủ Ollama LLM");

                save("ai.ollama_model",
                                defaults.getAi().getOllamaModel(),
                                "AI", "Tên model đang chạy");

                save("ai.auto_resolve",
                                String.valueOf(defaults.getAi().isAutoResolve()),
                                "AI", "Tự động chốt lỗi vặt");

                // ── Tab 4: Alerts & Webhooks ──
                save("alert.admin_emails",
                                defaults.getAlert().getAdminEmails(),
                                "ALERT", "Danh sách Email nhận Cảnh báo khẩn cấp (cách nhau dấu phẩy)");

                save("alert.webhook_url",
                                defaults.getAlert().getWebhookUrl(),
                                "ALERT", "URL Webhook (Discord/Slack/Telegram) nhận Push Notification");

                log.info("✅ Đã khởi tạo {} Settings mặc định từ application.yml!", systemSettingRepository.count());
        }

        private void save(String key, String value, String category, String description) {
                systemSettingRepository.save(new SystemSetting(key, value, category, description));
        }

        // ═══ CRUD Operations ═══

        public List<SystemSetting> getAllSettings() {
                initializeDefaults();
                return systemSettingRepository.findAll();
        }

        public String getSettingValue(String key, String defaultValue) {
                return systemSettingRepository.findById(key)
                                .map(SystemSetting::getSettingValue)
                                .orElse(defaultValue);
        }

        public int getSettingAsInt(String key, int defaultValue) {
                String val = getSettingValue(key, null);
                if (val == null)
                        return defaultValue;
                try {
                        return Integer.parseInt(val);
                } catch (NumberFormatException e) {
                        return defaultValue;
                }
        }

        public boolean getSettingAsBoolean(String key, boolean defaultValue) {
                String val = getSettingValue(key, null);
                if (val == null)
                        return defaultValue;
                return Boolean.parseBoolean(val);
        }

        public List<SystemSetting> getSettingsByCategory(String category) {
                return systemSettingRepository.findByCategory(category);
        }

        public boolean isMaintenanceMode() {
                return "true".equals(getSettingValue("general.maintenance_mode", "false"));
        }

        @org.springframework.transaction.annotation.Transactional
        public void updateSettings(Map<String, String> updates) {
                for (Map.Entry<String, String> entry : updates.entrySet()) {
                        SystemSetting setting = systemSettingRepository.findById(entry.getKey())
                                        .orElse(new SystemSetting(entry.getKey(), "", "CUSTOM", ""));
                        setting.setSettingValue(entry.getValue());
                        systemSettingRepository.save(setting);
                }
        }
}
