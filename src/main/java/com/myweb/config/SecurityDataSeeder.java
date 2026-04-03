package com.myweb.config;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.myweb.entity.SecurityEvent;
import com.myweb.entity.SecurityEvent.Severity;
import com.myweb.entity.SecurityEvent.Source;
import com.myweb.repository.SecurityEventRepository;

/**
 * Seeds the security_events table with realistic sample data on startup.
 * Only runs if the table is empty, so safe to keep active.
 *
 * This ensures the Security Dashboard and AI Advisor have
 * meaningful data to display for demonstration purposes.
 */
@Component
@Order(200) // Run after other initializers
public class SecurityDataSeeder implements CommandLineRunner {

        private static final Logger log = LoggerFactory.getLogger(SecurityDataSeeder.class);

        private final SecurityEventRepository repository;
        private final Random random = new Random(42); // Deterministic seed for reproducible data

        // Realistic attack IPs
        private static final String[] ATTACK_IPS = {
                        "192.168.1.105", "10.0.0.23", "45.33.32.156",
                        "203.0.113.42", "198.51.100.17", "172.16.0.99",
                        "185.220.101.55", "91.121.148.33", "78.128.113.14",
                        "103.25.60.10", "222.186.15.101", "58.218.198.45"
        };

        // Realistic usernames
        private static final String[] USERNAMES = {
                        "admin", "root", "user123", "test", "admin@myweb.com",
                        "nguyen.van.a", "le.thi.b", "tran.minh.c", "security_admin"
        };

        public SecurityDataSeeder(SecurityEventRepository repository) {
                this.repository = repository;
        }

        @Override
        public void run(String... args) {
                if (repository.count() > 0) {
                        log.info("📊 Security events already exist ({} events) — skipping seed.", repository.count());
                        return;
                }

                log.info("🌱 Seeding security events for demo...");

                List<SecurityEvent> events = new ArrayList<>();
                Instant now = Instant.now();

                // ═══════════════════════════════════════════════
                // 1. BRUTE FORCE ATTACKS (last 7 days)
                // ═══════════════════════════════════════════════
                String[] bruteForceIps = { "185.220.101.55", "91.121.148.33", "222.186.15.101" };
                for (String ip : bruteForceIps) {
                        int attempts = 5 + random.nextInt(20);
                        for (int i = 0; i < attempts; i++) {
                                SecurityEvent e = new SecurityEvent();
                                e.setSource(Source.BRUTE_FORCE);
                                e.setSeverity(i > 15 ? Severity.CRITICAL : Severity.HIGH);
                                e.setEventType("BRUTE_FORCE_DETECTED");
                                e.setSourceIp(ip);
                                e.setDescription(String.format(
                                                "Brute force attempt #%d: %d failed logins for user '%s' from %s",
                                                i + 1, i + 1, USERNAMES[random.nextInt(USERNAMES.length)], ip));
                                e.setCreatedAt(now.minus(random.nextInt(7 * 24), ChronoUnit.HOURS)
                                                .minus(random.nextInt(60), ChronoUnit.MINUTES));
                                e.setResolved(random.nextFloat() < 0.3);
                                events.add(e);
                        }
                }

                // ═══════════════════════════════════════════════
                // 2. IP BLOCKED EVENTS
                // ═══════════════════════════════════════════════
                for (String ip : bruteForceIps) {
                        SecurityEvent e = new SecurityEvent();
                        e.setSource(Source.BRUTE_FORCE);
                        e.setSeverity(Severity.HIGH);
                        e.setEventType("IP_BLOCKED");
                        e.setSourceIp(ip);
                        e.setDescription("IP blocked: Auto-blocked after 20+ failures (blocked 1h)");
                        e.setCreatedAt(now.minus(random.nextInt(48), ChronoUnit.HOURS));
                        e.setResolved(false);
                        events.add(e);
                }

                // ═══════════════════════════════════════════════
                // 3. RATE LIMIT VIOLATIONS (AI chat abuse)
                // ═══════════════════════════════════════════════
                String[] rateLimitIps = { "10.0.0.23", "203.0.113.42", "103.25.60.10" };
                for (String ip : rateLimitIps) {
                        int violations = 3 + random.nextInt(8);
                        for (int i = 0; i < violations; i++) {
                                SecurityEvent e = new SecurityEvent();
                                e.setSource(Source.RATE_LIMIT);
                                e.setSeverity(Severity.MEDIUM);
                                e.setEventType("RATE_LIMIT_EXCEEDED");
                                e.setSourceIp(ip);
                                e.setDescription(String.format(
                                                "Rate limit exceeded: IP %s sent %d requests in 1 minute (limit: 20)",
                                                ip, 20 + random.nextInt(30)));
                                e.setCreatedAt(now.minus(random.nextInt(5 * 24), ChronoUnit.HOURS)
                                                .minus(random.nextInt(60), ChronoUnit.MINUTES));
                                e.setResolved(true);
                                events.add(e);
                        }
                }

                // ═══════════════════════════════════════════════
                // 4. AUTH FAILURES (login errors)
                // ═══════════════════════════════════════════════
                for (int i = 0; i < 25; i++) {
                        SecurityEvent e = new SecurityEvent();
                        e.setSource(Source.AUTH);
                        e.setSeverity(Severity.LOW);
                        e.setEventType("AUTH_FAILURE");
                        String ip = ATTACK_IPS[random.nextInt(ATTACK_IPS.length)];
                        String user = USERNAMES[random.nextInt(USERNAMES.length)];
                        e.setSourceIp(ip);
                        e.setDescription(String.format(
                                        "Login failure for user '%s': Bad credentials from IP %s", user, ip));
                        e.setCreatedAt(now.minus(random.nextInt(7 * 24), ChronoUnit.HOURS)
                                        .minus(random.nextInt(60), ChronoUnit.MINUTES));
                        e.setResolved(true);
                        events.add(e);
                }

                // ═══════════════════════════════════════════════
                // 5. SUSPICIOUS ACTIVITY
                // ═══════════════════════════════════════════════
                String[][] suspiciousEvents = {
                                { "SQL injection attempt detected in login form", "CRITICAL" },
                                { "XSS payload detected in contact form message field", "HIGH" },
                                { "Directory traversal attempt: /api/../../../etc/passwd", "CRITICAL" },
                                { "Abnormal API access pattern: 500+ requests to /api/admin/* in 5 minutes", "HIGH" },
                                { "Unauthorized access attempt to admin panel from external IP", "HIGH" },
                                { "Suspicious User-Agent: sqlmap/1.5.3 detected", "CRITICAL" },
                                { "Port scanning detected from external IP", "MEDIUM" },
                                { "Repeated failed API key validation from same origin", "MEDIUM" },
                                { "Access denied: /api/admin/users from non-admin account", "MEDIUM" },
                                { "Multiple password reset requests for different accounts", "MEDIUM" },
                                { "Unusual login time: Admin login at 03:42 AM from new IP", "LOW" },
                                { "Large file upload attempt exceeding size limit (50MB)", "LOW" },
                };

                for (String[] eventData : suspiciousEvents) {
                        SecurityEvent e = new SecurityEvent();
                        e.setSource(Source.SYSTEM);
                        e.setSeverity(Severity.valueOf(eventData[1]));
                        e.setEventType("SUSPICIOUS_ACTIVITY");
                        e.setSourceIp(ATTACK_IPS[random.nextInt(ATTACK_IPS.length)]);
                        e.setDescription(eventData[0]);
                        e.setCreatedAt(now.minus(random.nextInt(6 * 24), ChronoUnit.HOURS)
                                        .minus(random.nextInt(60), ChronoUnit.MINUTES));
                        e.setResolved(random.nextFloat() < 0.2);
                        events.add(e);
                }

                // ═══════════════════════════════════════════════
                // 6. RECENT CRITICAL EVENTS (last 24h — for live dashboard)
                // ═══════════════════════════════════════════════
                String[] recentAttacks = {
                                "Active brute force from 185.220.101.55: 35 attempts in 10 minutes targeting 'admin'",
                                "DDoS signature detected: SYN flood from 222.186.15.101",
                                "Credential stuffing detected: 50+ unique usernames tried from 58.218.198.45",
                                "WAF bypass attempt: encoded SQL injection payload in X-Forwarded-For header",
                                "Unauthorized API access: JWT token reuse detected after logout",
                };

                for (int i = 0; i < recentAttacks.length; i++) {
                        SecurityEvent e = new SecurityEvent();
                        e.setSource(i < 2 ? Source.BRUTE_FORCE : Source.SYSTEM);
                        e.setSeverity(Severity.CRITICAL);
                        e.setEventType(i < 2 ? "BRUTE_FORCE_DETECTED" : "SUSPICIOUS_ACTIVITY");
                        e.setSourceIp(ATTACK_IPS[random.nextInt(ATTACK_IPS.length)]);
                        e.setDescription(recentAttacks[i]);
                        e.setCreatedAt(now.minus(random.nextInt(23), ChronoUnit.HOURS)
                                        .minus(random.nextInt(59), ChronoUnit.MINUTES));
                        e.setResolved(false);
                        events.add(e);
                }

                // ═══════════════════════════════════════════════
                // 7. MANUAL EVENTS (admin logged)
                // ═══════════════════════════════════════════════
                SecurityEvent manual1 = new SecurityEvent();
                manual1.setSource(Source.MANUAL);
                manual1.setSeverity(Severity.HIGH);
                manual1.setEventType("MANUAL_REPORT");
                manual1.setSourceIp("external");
                manual1.setDescription(
                                "Security audit finding: API endpoint /api/users returns full user data without pagination limit");
                manual1.setCreatedAt(now.minus(3, ChronoUnit.DAYS));
                manual1.setResolved(true);
                manual1.setAiAnalysis(Map.of("analysis",
                                "This is a data exposure vulnerability. Recommend implementing pagination (max 50 results per page) and field filtering to exclude sensitive data like passwords and tokens from API responses."));
                events.add(manual1);

                SecurityEvent manual2 = new SecurityEvent();
                manual2.setSource(Source.MANUAL);
                manual2.setSeverity(Severity.MEDIUM);
                manual2.setEventType("MANUAL_REPORT");
                manual2.setSourceIp("internal");
                manual2.setDescription("CORS policy review: Wildcard origins detected in development configuration");
                manual2.setCreatedAt(now.minus(5, ChronoUnit.DAYS));
                manual2.setResolved(false);
                events.add(manual2);

                // Save all events
                repository.saveAll(events);
                log.info("✅ Seeded {} security events across {} categories for demo dashboard.",
                                events.size(), "7");
        }
}
