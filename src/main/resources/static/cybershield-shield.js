/*
 * 🛡️ CyberShield Shield Agent v1.0
 * [SOC AS A SERVICE - ĐƠN VỊ BẢO VỆ WEBSITE KHÁCH HÀNG]
 * -----------------------------------------------------------
 * TÍNH NĂNG:
 * - Tự động phát hiện tấn công XSS trong Form.
 * - Phát hiện hành vi tiêm nhiễm SQL (SQL Injection).
 * - Theo dõi các tham số URL độc hại.
 * - Gửi báo cáo theo thời gian thực về trung tâm SOC CyberShield.
 */
(function() {
    // 1. [KHỞI TẠO CẤU HÌNH] - Lấy API Key từ tham số nhúng script
    const scriptTag = document.currentScript;
    const apiKey = new URL(scriptTag.src).searchParams.get("key");
    const CYBERSHIELD_ENDPOINT = "https://cybershield-prod.onrender.com/api/v1/external/alert";

    if (!apiKey) {
        console.error("%c[CyberShield Error]%c API Key is missing! Shield Agent cannot protect this site.", "color: red; font-weight: bold", "color: gray");
        return;
    }

    console.log("%c[CyberShield]%c Shield Agent is active. Monitoring for threats...", "color: #00ff00; font-weight: bold", "color: gray");

    // 2. [MA TRẬN NHẬN DIỆN TẤN CÔNG] - Các Regex mẫu tấn công phổ biến
    const THREAT_PATTERNS = {
        XSS: /<script|onerror|alert\(|onclick|javascript:|<iframe>/i,
        SQL_INJECTION: /' OR 1=1|--|DROP TABLE|INSERT INTO|SELECT.*FROM|UNION SELECT/i,
        SUSPICIOUS: /[<>\"\'%;\(\)\&\+]/
    };

    /**
     * 3. [HÀM BÁO CÁO SOC] - Gửi tín hiệu về hệ thống trung tâm CyberShield
     */
    async function reportAttack(type, payload) {
        try {
            await fetch(`${CYBERSHIELD_ENDPOINT}?apiKey=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attackType: type,
                    payload: payload,
                    attackerIp: "CLIENT_SIDE_BOT", // IP sẽ được Server-side SOC ghi nhận chính xác hơn
                    targetPath: window.location.href
                })
            });
            console.warn(`%c[CyberShield Alert]%c Potential ${type} detected! Alert sent to SOC Central.`, "color: orange; font-weight: bold", "color: gray");
        } catch (err) {
            // Không làm ảnh hưởng đến trải nghiệm người dùng cuối nếu Backend bận
        }
    }

    /**
     * 4. [LẮNG NGHE FORM] - Chặn đứng các nỗ lực tấn công qua ô nhập liệu
     */
    document.addEventListener("submit", function(event) {
        const form = event.target;
        const inputs = form.querySelectorAll("input, textarea, select");
        let threatFound = false;

        inputs.forEach(input => {
            const value = input.value;
            if (value && typeof value === "string") {
                // Kiểm tra XSS
                if (THREAT_PATTERNS.XSS.test(value)) {
                    reportAttack("XSS_DETECTION", `Field [${input.name || input.id}]: ${value}`);
                    threatFound = true;
                }
                // Kiểm tra SQL Injection
                if (THREAT_PATTERNS.SQL_INJECTION.test(value)) {
                    reportAttack("SQL_INJECTION_DETECTION", `Field [${input.name || input.id}]: ${value}`);
                    threatFound = true;
                }
            }
        });
        
        // Ghi chú: Chúng ta không chặn form (e.preventDefault) để tránh làm hỏng logic của khách,
        // nhưng chúng ta sẽ "bắt quả tang" và báo cáo ngay lập tức.
    });

    /**
     * 5. [URL SECURITY SCANNER] - Quét thanh địa chỉ (Chống URL Injection)
     */
    const urlParams = window.location.search;
    if (THREAT_PATTERNS.XSS.test(urlParams) || THREAT_PATTERNS.SQL_INJECTION.test(urlParams)) {
        reportAttack("URL_INJECTION_DETECTED", urlParams);
    }

})();
