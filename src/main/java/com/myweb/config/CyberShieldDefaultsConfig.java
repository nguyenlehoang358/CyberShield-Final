package com.myweb.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Đọc các giá trị mặc định từ application.yml (block cybershield.defaults).
 * Khi database trống, SystemSettingService sẽ dùng class này để seed.
 */
@Configuration
@ConfigurationProperties(prefix = "cybershield.defaults")
public class CyberShieldDefaultsConfig {

    private GeneralDefaults general = new GeneralDefaults();
    private DefenseDefaults defense = new DefenseDefaults();
    private AiDefaults ai = new AiDefaults();
    private AlertDefaults alert = new AlertDefaults();

    // ── Tab 1: General ──
    public static class GeneralDefaults {
        private boolean maintenanceMode = false;
        private String logLevel = "ALL";
        private String defaultLang = "vi";

        public boolean isMaintenanceMode() {
            return maintenanceMode;
        }

        public void setMaintenanceMode(boolean maintenanceMode) {
            this.maintenanceMode = maintenanceMode;
        }

        public String getLogLevel() {
            return logLevel;
        }

        public void setLogLevel(String logLevel) {
            this.logLevel = logLevel;
        }

        public String getDefaultLang() {
            return defaultLang;
        }

        public void setDefaultLang(String defaultLang) {
            this.defaultLang = defaultLang;
        }
    }

    // ── Tab 2: Defense ──
    public static class DefenseDefaults {
        private int autoBanThreshold = 5;
        private int blockDurationMinutes = 60;
        private String ipWhitelist = "127.0.0.1";

        public int getAutoBanThreshold() {
            return autoBanThreshold;
        }

        public void setAutoBanThreshold(int autoBanThreshold) {
            this.autoBanThreshold = autoBanThreshold;
        }

        public int getBlockDurationMinutes() {
            return blockDurationMinutes;
        }

        public void setBlockDurationMinutes(int blockDurationMinutes) {
            this.blockDurationMinutes = blockDurationMinutes;
        }

        public String getIpWhitelist() {
            return ipWhitelist;
        }

        public void setIpWhitelist(String ipWhitelist) {
            this.ipWhitelist = ipWhitelist;
        }
    }

    // ── Tab 3: AI ──
    public static class AiDefaults {
        private String sensitivity = "MEDIUM";
        private String ollamaUrl = "http://127.0.0.1:11434";
        private String ollamaModel = "qwen2.5:0.5b";
        private boolean autoResolve = true;

        public String getSensitivity() {
            return sensitivity;
        }

        public void setSensitivity(String sensitivity) {
            this.sensitivity = sensitivity;
        }

        public String getOllamaUrl() {
            return ollamaUrl;
        }

        public void setOllamaUrl(String ollamaUrl) {
            this.ollamaUrl = ollamaUrl;
        }

        public String getOllamaModel() {
            return ollamaModel;
        }

        public void setOllamaModel(String ollamaModel) {
            this.ollamaModel = ollamaModel;
        }

        public boolean isAutoResolve() {
            return autoResolve;
        }

        public void setAutoResolve(boolean autoResolve) {
            this.autoResolve = autoResolve;
        }
    }

    // ── Tab 4: Alerts ──
    public static class AlertDefaults {
        private String adminEmails = "admin@cybershield.local";
        private String webhookUrl = "";

        public String getAdminEmails() {
            return adminEmails;
        }

        public void setAdminEmails(String adminEmails) {
            this.adminEmails = adminEmails;
        }

        public String getWebhookUrl() {
            return webhookUrl;
        }

        public void setWebhookUrl(String webhookUrl) {
            this.webhookUrl = webhookUrl;
        }
    }

    // Root Getters / Setters
    public GeneralDefaults getGeneral() {
        return general;
    }

    public void setGeneral(GeneralDefaults general) {
        this.general = general;
    }

    public DefenseDefaults getDefense() {
        return defense;
    }

    public void setDefense(DefenseDefaults defense) {
        this.defense = defense;
    }

    public AiDefaults getAi() {
        return ai;
    }

    public void setAi(AiDefaults ai) {
        this.ai = ai;
    }

    public AlertDefaults getAlert() {
        return alert;
    }

    public void setAlert(AlertDefaults alert) {
        this.alert = alert;
    }
}
