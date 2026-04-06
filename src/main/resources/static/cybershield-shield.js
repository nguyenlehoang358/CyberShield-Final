/*
 * 🛡️ CyberShield Shield Agent v1.2 [PROACTIVE DEFENSE]
 * [SOC AS A SERVICE - HỆ THỐNG PHÒNG THỦ CHỦ ĐỘNG]
 */
(function() {
    const scriptTag = document.currentScript;
    const apiKey = new URL(scriptTag.src).searchParams.get("key");
    const CYBERSHIELD_ENDPOINT = "https://cybershield-prod.onrender.com/api/v1/external/alert";

    if (!apiKey) return;

    console.log("%c[CyberShield]%c Proactive Defense v1.2 is active.", "color: #00ff00; font-weight: bold", "color: gray");

    const THREAT_PATTERNS = {
        XSS: /<script|onerror|alert\(|onclick|javascript:|<iframe>/i,
        SQL_INJECTION: /' OR 1=1|--|DROP TABLE|INSERT INTO|SELECT.*FROM|UNION SELECT/i
    };

    /**
     * HÀM BÁO CÁO SOC
     */
    async function reportAttack(type, payload) {
        try {
            await fetch(`${CYBERSHIELD_ENDPOINT}?apiKey=${apiKey}`, {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attackType: type,
                    payload: payload,
                    attackerIp: "SOC_AGENT_SHIELD",
                    targetPath: window.location.href
                })
            });
        } catch (err) {}
    }

    /**
     * HÀM CHẶN ĐỨNG TẤN CÔNG (THE BLOCKER)
     */
    function blockAction(event, type, reason) {
        event.preventDefault(); // CHẶN ĐỨNG HÀNH ĐỘNG GỬI DỮ LIỆU ĐỘC HẠI
        event.stopPropagation();
        
        // Hiển thị cảnh báo chuyên nghiệp
        alert(`🛡️ [CyberShield Security]\n\nHành động của bạn đã bị chặn vì phát hiện dấu hiệu tấn công: ${type}\nChi tiết: ${reason}\n\nThông tin này đã được gửi về trung tâm SOC.`);
        
        console.error(`%c[Blocked]%c CyberShield neutralized a ${type} attempt.`, "color: red; font-weight: bold", "color: gray");
    }

    // 1. QUÉT VÀ CHẶN KHI SUBMIT (CHỐNG TẤN CÔNG FORM)
    document.addEventListener("submit", function(event) {
        const inputs = event.target.querySelectorAll("input, textarea");
        let isHostile = false;

        inputs.forEach(input => {
            const val = input.value;
            if (THREAT_PATTERNS.XSS.test(val)) {
                reportAttack("XSS_PREVENTED", val);
                blockAction(event, "XSS Attack", "Mã độc Script được phát hiện.");
                isHostile = true;
            } else if (THREAT_PATTERNS.SQL_INJECTION.test(val)) {
                reportAttack("SQL_INJECTION_PREVENTED", val);
                blockAction(event, "SQL Injection", "Hành vi tiêm nhiễm Database.");
                isHostile = true;
            }
        });
    }, true); // Use capture phase to intercept early

    // 2. QUÉT VÀ CHẶN TRÊN URL (URL ATTACK)
    if (THREAT_PATTERNS.XSS.test(window.location.search) || THREAT_PATTERNS.SQL_INJECTION.test(window.location.search)) {
        reportAttack("URL_ATTACK_RECORDS", window.location.search);
    }
})();
