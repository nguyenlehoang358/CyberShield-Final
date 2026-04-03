package com.myweb.config;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.myweb.entity.ERole;
import com.myweb.entity.Role;
import com.myweb.entity.User;
import com.myweb.repository.RoleRepository;
import com.myweb.repository.UserRepository;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Init Roles
            Arrays.stream(ERole.values()).forEach(roleName -> {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    Role role = new Role(roleName);
                    if (roleName == ERole.ROLE_ADMIN)
                        role.setDescription("Quản trị viên hệ thống");
                    if (roleName == ERole.ROLE_USER)
                        role.setDescription("Người dùng cơ bản");
                    roleRepository.save(role);
                    System.out.println("Created Role: " + roleName);
                }
            });

            // 2. Init Admin User
            if (!userRepository.existsByUsername("admin")) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@gmail.com");
                admin.setPassword(passwordEncoder.encode("admin1"));

                Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                        .orElseThrow(() -> new RuntimeException("Error: Role is not found."));

                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                admin.setRoles(roles);

                userRepository.save(admin);
                System.out.println("Admin user created: admin@gmail.com / admin1");
            }
        };
    }
}
