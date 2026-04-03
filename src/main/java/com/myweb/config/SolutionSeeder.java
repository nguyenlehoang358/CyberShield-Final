package com.myweb.config;

import com.myweb.entity.Solution;
import com.myweb.repository.SolutionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SolutionSeeder {

    private static final Logger log = LoggerFactory.getLogger(SolutionSeeder.class);

    @Bean
    public CommandLineRunner seedSolutions(SolutionRepository solutionRepository) {
        return args -> {
            boolean needSeed = false;
            if (solutionRepository.count() == 0) {
                needSeed = true;
            } else {
                Solution firstOption = solutionRepository.findAll().get(0);
                if (firstOption.getDetailJson() == null) {
                    log.info("Phát hiện dữ liệu Solutions phiên bản cũ (thiếu detailJson/relatedLabsJson). Tiến hành xóa và seed lại...");
                    solutionRepository.deleteAll();
                    needSeed = true;
                }
            }

            if (needSeed) {
                log.info("Bắt đầu khởi tạo dữ liệu Solutions mới...");

                List<Solution> solutions = Arrays.asList(
                        new Solution(
                                null,
                                "Bảo mật Ứng dụng",
                                "Application Security",
                                "Bảo vệ phần mềm khỏi các lỗ hổng và tấn công mạng.",
                                "Protect software from vulnerabilities and cyber attacks.",
                                "Code",
                                "blue",
                                1,
                                true,
                                "{\"concept\":\"Bảo mật ứng dụng là quá trình phát triển, thêm và kiểm tra các tính năng bảo mật trong ứng dụng để ngăn chặn các lỗ hổng.\",\"usage\":\"Sử dụng các công cụ kiểm tra bảo mật tĩnh (SAST) và động (DAST) trong quá trình phát triển (SDLC).\",\"application\":\"Áp dụng cho mọi ứng dụng web, mobile và API. Ngăn chặn các cuộc tấn công phổ biến như SQL Injection, XSS.\"}",
                                "[{\"id\":\"xss\",\"name\":\"XSS Lab\",\"path\":\"/lab/xss\"},{\"id\":\"sqli\",\"name\":\"SQL Injection Lab\",\"path\":\"/lab/sqli\"}]"
                        ),
                        new Solution(
                                null,
                                "Mật mã & Mã hóa",
                                "Cryptography",
                                "Đảm bảo tính bí mật và toàn vẹn của dữ liệu.",
                                "Ensure data confidentiality and integrity.",
                                "Lock",
                                "purple",
                                2,
                                true,
                                "{\"concept\":\"Mật mã học (Cryptography) là khoa học về việc giữ thông tin được an toàn, ngăn chặn các bên thứ ba đọc dữ liệu.\",\"usage\":\"Mã hóa dữ liệu khi lưu trữ (At Rest) và khi truyền tải (In Transit) sử dụng các thuật toán như AES, RSA.\",\"application\":\"Bảo vệ thông tin đăng nhập, dữ liệu thẻ tín dụng, và giao tiếp riêng tư qua HTTPS.\"}",
                                "[{\"id\":\"encryption\",\"name\":\"Encryption Lab\",\"path\":\"/lab/encryption\"},{\"id\":\"hashing\",\"name\":\"Hashing Lab\",\"path\":\"/lab/hashing\"}]"
                        ),
                        new Solution(
                                null,
                                "An ninh Mạng",
                                "Network Security",
                                "Kiểm soát truy cập và giám sát lưu lượng mạng.",
                                "Access control and network traffic monitoring.",
                                "Shield",
                                "green",
                                3,
                                true,
                                "{\"concept\":\"An ninh mạng bao gồm các chính sách và thực tiễn để ngăn chặn và giám sát truy cập trái phép vào mạng.\",\"usage\":\"Triển khai Firewall, VPN, và hệ thống phát hiện xâm nhập (IDS/IPS).\",\"application\":\"Ngăn chặn tấn công DDoS, lọc gói tin độc hại và đảm bảo an toàn cho hạ tầng mạng doanh nghiệp.\"}",
                                "[{\"id\":\"firewall\",\"name\":\"Firewall Lab\",\"path\":\"/lab/firewall\"},{\"id\":\"https\",\"name\":\"HTTPS/TLS Lab\",\"path\":\"/lab/https\"}]"
                        ),
                        new Solution(
                                null,
                                "Quản lý Định danh",
                                "Identity Management",
                                "Xác thực và ủy quyền người dùng an toàn.",
                                "Secure user authentication and authorization.",
                                "Users",
                                "pink",
                                4,
                                true,
                                "{\"concept\":\"IAM (Identity and Access Management) là khuôn khổ công nghệ quản lý danh tính số và quyền truy cập cấp phát.\",\"usage\":\"Sử dụng Multi-Factor Authentication (MFA), Single Sign-On (SSO) và JSON Web Tokens (JWT).\",\"application\":\"Đảm bảo đúng người truy cập đúng tài nguyên vào đúng thời điểm.\"}",
                                "[{\"id\":\"jwt\",\"name\":\"JWT Lab\",\"path\":\"/lab/jwt\"},{\"id\":\"password\",\"name\":\"Password Lab\",\"path\":\"/lab/password\"}]"
                        ),
                        new Solution(
                                null,
                                "Vận hành An ninh",
                                "Security Operations",
                                "Giám sát, phát hiện và phản ứng sự cố.",
                                "Monitoring, detection and incident response.",
                                "Activity",
                                "coral",
                                5,
                                true,
                                "{\"concept\":\"Security Operations (SecOps) kết hợp bảo mật và vận hành CNTT để theo dõi hệ thống 24/7.\",\"usage\":\"Sử dụng SIEM, phân tích nhật ký (Log Analysis) và quét lỗ hổng liên tục.\",\"application\":\"Phát hiện sớm các dấu hiệu tấn công và phản ứng nhanh chóng để giảm thiểu thiệt hại.\"}",
                                "[{\"id\":\"scanner\",\"name\":\"Security Scanner\",\"path\":\"/tools/scanner\"}]"
                        ),
                        new Solution(
                                null,
                                "Bảo mật Đám mây",
                                "Cloud Security",
                                "Bảo vệ dữ liệu và ứng dụng trên nền tảng Cloud.",
                                "Protect data and applications on Cloud platforms.",
                                "Cloud",
                                "cyan",
                                6,
                                true,
                                "{\"concept\":\"Bảo mật đám mây đề cập đến một tập hợp các chính sách và điều khiển để bảo vệ dữ liệu, hạ tầng cloud.\",\"usage\":\"Quản lý cấu hình an toàn, mã hóa dữ liệu trên Cloud, và phân quyền qua IAM Roles.\",\"application\":\"Đảm bảo tuân thủ và độ an toàn cho các ứng dụng chạy trên AWS, Azure, Google Cloud.\"}",
                                "[]"
                        )
                );

                solutionRepository.saveAll(solutions);
                log.info("Khởi tạo thành công {} Solutions!", solutions.size());
            } else {
                log.info("Dữ liệu Solutions đã tồn tại, bỏ qua Seed.");
            }
        };
    }
}
