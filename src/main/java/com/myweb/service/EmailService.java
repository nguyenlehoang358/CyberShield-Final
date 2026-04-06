package com.myweb.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Async
    public void sendContactNotification(String customerName, String customerEmail, String subject, String message) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            // mailMessage.setFrom("CyberShield <no-reply@cybershield.com>");
            mailMessage.setFrom("nguyenlehoang358@gmail.com");
            // Hoặc
            mailMessage.setFrom(customerEmail); // Để Admin thấy email khách hàng ngay tiêu đề
            mailMessage.setTo("nguyenlehoang358@gmail.com");
            mailMessage.setSubject("🔔 Liên hệ mới từ CyberShield: " + (subject != null ? subject : "Yêu cầu chung"));

            String emailContent = String.format(
                    "Bạn có một tin nhắn liên hệ mới từ hệ thống CyberShield.\n\n" +
                            "👤 Người gửi: %s\n" +
                            "📧 Email: %s\n" +
                            "📝 Tiêu đề: %s\n" +
                            "💬 Nội dung:\n%s\n\n" +
                            "--- CyberShield Security Dashboard ---",
                    customerName, customerEmail, (subject != null ? subject : "N/A"), message);

            mailMessage.setText(emailContent);
            mailSender.send(mailMessage);
            log.info("✅ Email notification sent to admin for contact from: {}", customerEmail);
        } catch (Exception e) {
            log.error("❌ Failed to send email notification: {}", e.getMessage());
        }
    }
}
