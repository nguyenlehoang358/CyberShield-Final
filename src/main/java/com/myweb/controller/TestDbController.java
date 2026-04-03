package com.myweb.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.myweb.entity.User;
import com.myweb.repository.UserRepository;

@RestController
@RequestMapping("/api/public/test")
public class TestDbController {

    private final UserRepository userRepository;

    public TestDbController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<?> testDatabaseConnection() {
        try {
            // 1. Chỉ đếm số lượng (Test kết nối DB cực nhẹ)
            long count = userRepository.count();

            // 2. Chỉ lấy danh sách Username (Tránh vòng lặp JSON và lỗi Encryptor)
            List<User> users = userRepository.findAll();
            List<String> usernames = users.stream()
                                          .map(User::getUsername)
                                          .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "status", "Kết nối Database THÀNH CÔNG!",
                    "totalUsers", count,
                    "usernames", usernames
            ));

        } catch (Exception e) {
            // Lệnh này ép Spring Boot in lỗi chi tiết ra màn hình console của bạn
            e.printStackTrace(); 
            return ResponseEntity.internalServerError().body("Lỗi DB: " + e.getMessage() + " | Nguyên nhân: " + e.getCause());
        }
    }
}