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

        // Recent login attempts (paged) for admin dashboard
        Page<LoginAttempt> findAllByOrderByCreatedAtDesc(Pageable pageable);

        // Failed attempts for a specific IP
        List<LoginAttempt> findByIpAddressAndSuccessFalseAndCreatedAtAfterOrderByCreatedAtDesc(
                        String ipAddress, Instant after);

        // Failed attempts for a specific username
        List<LoginAttempt> findByUsernameAndSuccessFalseAndCreatedAtAfterOrderByCreatedAtDesc(
                        String username, Instant after);

        // Count failed attempts from an IP in the last N hours
        @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.ipAddress = :ip AND la.success = false AND la.createdAt > :since")
        long countRecentFailures(@Param("ip") String ip, @Param("since") Instant since);

        // Count total failures today
        @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.success = false AND la.createdAt > :since")
        long countTotalFailuresSince(@Param("since") Instant since);

        // Count total successes today
        @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.success = true AND la.createdAt > :since")
        long countTotalSuccessesSince(@Param("since") Instant since);

        // Top attacking IPs (most failures)
        @Query("SELECT la.ipAddress, COUNT(la) as cnt FROM LoginAttempt la WHERE la.success = false AND la.createdAt > :since GROUP BY la.ipAddress ORDER BY cnt DESC")
        List<Object[]> findTopAttackingIPs(@Param("since") Instant since, Pageable pageable);

        // Top targeted usernames
        @Query("SELECT la.username, COUNT(la) as cnt FROM LoginAttempt la WHERE la.success = false AND la.createdAt > :since AND la.username IS NOT NULL GROUP BY la.username ORDER BY cnt DESC")
        List<Object[]> findTopTargetedUsers(@Param("since") Instant since, Pageable pageable);

        // Search by IP or username
        @Query("SELECT la FROM LoginAttempt la WHERE (la.ipAddress LIKE %:query% OR la.username LIKE %:query%) ORDER BY la.createdAt DESC")
        Page<LoginAttempt> searchByIpOrUsername(@Param("query") String query, Pageable pageable);

        // ═══ ALL-TIME queries (no time filter) for Dashboard display ═══

        @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.success = false")
        long countTotalFailuresAllTime();

        @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.success = true")
        long countTotalSuccessesAllTime();

        @Query("SELECT la.ipAddress, COUNT(la) as cnt FROM LoginAttempt la WHERE la.success = false GROUP BY la.ipAddress ORDER BY cnt DESC")
        List<Object[]> findTopAttackingIPsAllTime(Pageable pageable);

        @Query("SELECT la.username, COUNT(la) as cnt FROM LoginAttempt la WHERE la.success = false AND la.username IS NOT NULL GROUP BY la.username ORDER BY cnt DESC")
        List<Object[]> findTopTargetedUsersAllTime(Pageable pageable);
}
