/*
 * 🛡️ CyberShield Shield Agent v1.1 [ULTRA MONITOR]
 * [SOC AS A SERVICE - ĐƠN VỊ BẢO VỆ WEBSITE KHÁCH HÀNG]
 */
(function() {
    const scriptTag = document.currentScript;
    const apiKey = new URL(scriptTag.src).searchParams.get("key");
    const CYBERSHIELD_ENDPOINT = "https://cybershield-prod.onrender.com/api/v1/external/alert";

    if (!apiKey) return;

    console.log("%c[CyberShield]%c Shield Agent v1.1 is active.", "color: #00ff00; font-weight: bold", "color: gray");

    const THREAT_PATTERNS = {
        XSS: /<script|onerror|alert\(|onclick|javascript:|<iframe>/i,
        SQL_INJECTION: /' OR 1=1|--|DROP TABLE|INSERT INTO|SELECT.*FROM|UNION SELECT/i
    };

    async function reportAttack(type, payload) {
        console.log(`[CyberShield] Investigating suspicious activity...`);
        try {
            await fetch(`${CYBERSHIELD_ENDPOINT}?apiKey=${apiKey}`, {
                method: "POST",
                mode: "cors", // Đảm bảo chạy xuyên tên miền
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attackType: type,
                    payload: payload,
                    attackerIp: "CLIENT_SIDE_AGENT",
                    targetPath: window.location.href
                })
            });
            console.warn(`[CyberShield] Threat ${type} reported!`);
        } catch (err) {
            console.error("[CyberShield] SOC Communication failed:", err);
        }
    }

    // 1. CHỦ ĐỘNG QUÉT: Quét ngay khi người dùng rời khỏi ô nhập liệu (onBlur)
    document.addEventListener("focusout", function(event) {
        if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
            const value = event.target.value;
            if (THREAT_PATTERNS.XSS.test(value)) reportAttack("XSS_DETECTION", `Input [${event.target.name}]: ${value}`);
            if (THREAT_PATTERNS.SQL_INJECTION.test(value)) reportAttack("SQL_INJECTION", `Input [${event.target.name}]: ${value}`);
        }
    });

    // 2. QUÉT KHI CLICK: Quét khi người dùng nhấn bất kỳ nút nào (Dành cho Form dùng AJAX)
    document.addEventListener("click", function(event) {
        if (event.target.tagName === "BUTTON" || (event.target.tagName === "INPUT" && event.target.type === "submit")) {
            const inputs = document.querySelectorAll("input");
            inputs.forEach(input => {
                const value = input.value;
                if (THREAT_PATTERNS.XSS.test(value)) reportAttack("XSS_DETECTION_ON_CLICK", value);
                if (THREAT_PATTERNS.SQL_INJECTION.test(value)) reportAttack("SQL_INJECTION_ON_CLICK", value);
            });
        }
    });

    // 3. QUÉT URL (URL Injection)
    if (THREAT_PATTERNS.XSS.test(window.location.search) || THREAT_PATTERNS.SQL_INJECTION.test(window.location.search)) {
        reportAttack("URL_INJECTION", window.location.search);
    }
})();
