package com.myweb.config;

import java.util.HashSet;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.myweb.entity.ERole;
import com.myweb.entity.Role;
import com.myweb.entity.User;
import com.myweb.entity.Contact;
import com.myweb.entity.Blog;
import com.myweb.repository.RoleRepository;
import com.myweb.repository.UserRepository;
import com.myweb.repository.ContactRepository;
import com.myweb.repository.BlogRepository;
import java.time.Instant;

@Component
public class DataInitializer implements CommandLineRunner {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;
        private final ContactRepository contactRepository;
        private final BlogRepository blogRepository;

        public DataInitializer(UserRepository userRepository, RoleRepository roleRepository,
                        PasswordEncoder passwordEncoder, ContactRepository contactRepository, BlogRepository blogRepository) {
                this.userRepository = userRepository;
                this.roleRepository = roleRepository;
                this.passwordEncoder = passwordEncoder;
                this.contactRepository = contactRepository;
                this.blogRepository = blogRepository;
        }

        @Override
        public void run(String... args) {
                System.out.println("=== DataInitializer: Starting... ===");

                // Build roles first to ensure they exist
                Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseGet(() -> roleRepository.save(new Role(ERole.ROLE_ADMIN)));
                Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseGet(() -> roleRepository.save(new Role(ERole.ROLE_USER)));

                System.out.println("=== Roles created/found: ADMIN + USER ===");

                // Migrate existing admin from @myweb.com to @gmail.com
                userRepository.findByEmail("admin@myweb.com").ifPresent(existingAdmin -> {
                        existingAdmin.setEmail("admin@gmail.com");
                        existingAdmin.setPassword(passwordEncoder.encode("admin1"));
                        userRepository.save(existingAdmin);
                        System.out.println("=== ADMIN MIGRATED: admin@myweb.com -> admin@gmail.com / admin1 ===");
                });

                if (userRepository.findByEmail("admin@gmail.com").isEmpty()
                                && !userRepository.existsByUsername("admin")) {
                        User admin = new User();
                        admin.setUsername("admin");
                        admin.setEmail("admin@gmail.com");
                        admin.setPassword(passwordEncoder.encode("admin1"));
                        admin.setAccountNonExpired(true);
                        admin.setAccountNonLocked(true);
                        admin.setCredentialsNonExpired(true);
                        admin.setEnabled(true);

                        Set<Role> roles = new HashSet<>();
                        roles.add(adminRole);
                        roles.add(userRole);
                        admin.setRoles(roles);

                        userRepository.save(admin);
                        System.out.println("=== ADMIN CREATED: admin@gmail.com / admin1 ===");
                } else {
                        System.out.println("=== Admin already exists, skipping creation ===");
                }

                seedSolutions();
                seedContacts();
                seedBlogs();
        }

        private void seedSolutions() {
                // Delegated to SolutionSeeder
        }

        private void seedContacts() {
            if (contactRepository.count() == 0) {
                System.out.println("=== Seeding Contacts ===");
                String[][] mockContacts = {
                    {"Nguyễn Văn Bảo", "nguyenvanbao@gmail.com", "Vui lòng tư vấn giải pháp chống Brute Force cho website."},
                    {"Trần Thị Hà", "tranha.sec@yahoo.com", "CyberShield có phân tích mã nguồn không?"},
                    {"Lê Minh Phân", "minh.phan99@student.edu.vn", "Xin chào, lab SQL Injection đang bị lỗi."}
                };
                for (String[] data : mockContacts) {
                    Contact c = new Contact();
                    c.setName(data[0]); c.setEmail(data[1]); c.setMessage(data[2]); 
                    c.setIsRead(false); c.setCreatedAt(Instant.now());
                    contactRepository.save(c);
                }
            }
        }

        private void seedBlogs() {
            if (blogRepository.count() == 0) {
                System.out.println("=== Seeding Default Blogs ===");
                String[][] mockBlogs = {
                    {"Nghiên cứu mới về APT-28", "Nhóm hacker APT-28 đã cập nhật mã độc backdoor mới, nhắm vào các hạ tầng...", "https://thehackernews.com/article1", "https://thehackernews.com/new-images/img/apt.jpg"},
                    {"Ransomware tấn công bệnh viện", "Theo nguồn tin, hơn 14 bệnh viện đã bị ảnh hưởng nặng nề bởi Ransomware biến thể mới.", "https://thehackernews.com/article2", "https://thehackernews.com/new-images/img/rans.jpg"}
                };
                for (String[] data : mockBlogs) {
                    Blog b = new Blog();
                    b.setTitle(data[0]); b.setSummary(data[1]); b.setUrl(data[2]); b.setImageUrl(data[3]);
                    b.setPublishedAt(Instant.now()); b.setPublished(true);
                    blogRepository.save(b);
                }
            }
        }
}
