package com.myweb.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.myweb.entity.LoginAttempt;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

        Page<LoginAttempt> findAllByOrderByCreatedAtDesc(Pageable pageable);

        /**
         * Counts failed login attempts from an IP after a specific time.
         * Using the helper method logic for BruteForceProtectionService.
         */
        @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.ipAddress = :ip AND la.success = false AND la.createdAt > :since")
        long countRecentFailures(@Param("ip") String ip, @Param("since") Instant since);

        // Alias for the Service signature (Compatibility)
        default long countByIpAddressAndStatusAndCreatedAtAfter(String ip, LoginAttempt.Status status, Instant since) {
                return countRecentFailures(ip, since);
        }

        // Search by IP or username
        @Query("SELECT la FROM LoginAttempt la WHERE (la.ipAddress LIKE %:query% OR la.username LIKE %:query%) ORDER BY la.createdAt DESC")
        Page<LoginAttempt> searchByIpOrUsername(@Param("query") String query, Pageable pageable);

        // Standard stats for dashboard
        @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.success = false AND la.createdAt > :since")
        long countTotalFailuresSince(@Param("since") Instant since);

        @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.success = true AND la.createdAt > :since")
        long countTotalSuccessesSince(@Param("since") Instant since);

        // --- All-time statistics for dashboard ---

        @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.success = false")
        long countTotalFailuresAllTime();

        @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.success = true")
        long countTotalSuccessesAllTime();

        @Query("SELECT la.ipAddress, COUNT(la) FROM LoginAttempt la WHERE la.success = false GROUP BY la.ipAddress ORDER BY COUNT(la) DESC")
        List<Object[]> findTopAttackingIPsAllTime(Pageable pageable);

        @Query("SELECT la.username, COUNT(la) FROM LoginAttempt la WHERE la.success = false GROUP BY la.username ORDER BY COUNT(la) DESC")
        List<Object[]> findTopTargetedUsersAllTime(Pageable pageable);
}
