package com.myweb.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.myweb.entity.SecurityEvent;

/**
 * Repository for security events with analytics queries.
 */
@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    // Recent events ordered by time
    List<SecurityEvent> findTop50ByOrderByCreatedAtDesc();

    // Events by severity
    List<SecurityEvent> findBySeverityOrderByCreatedAtDesc(SecurityEvent.Severity severity);

    // Unresolved events
    List<SecurityEvent> findByResolvedFalseOrderByCreatedAtDesc();

    // Events since a given time
    List<SecurityEvent> findByCreatedAtAfterOrderByCreatedAtDesc(Instant since);

    // Count by severity since a given time
    @Query("SELECT e.severity, COUNT(e) FROM SecurityEvent e WHERE e.createdAt > :since GROUP BY e.severity")
    List<Object[]> countBySeveritySince(@Param("since") Instant since);

    // Count by event type since a given time
    @Query("SELECT e.eventType, COUNT(e) FROM SecurityEvent e WHERE e.createdAt > :since GROUP BY e.eventType ORDER BY COUNT(e) DESC")
    List<Object[]> countByEventTypeSince(@Param("since") Instant since);

    // Top attacking IPs
    @Query("SELECT e.sourceIp, COUNT(e) as cnt FROM SecurityEvent e WHERE e.createdAt > :since AND e.sourceIp IS NOT NULL GROUP BY e.sourceIp ORDER BY cnt DESC")
    List<Object[]> topAttackingIPs(@Param("since") Instant since, Pageable pageable);

    // Count unresolved events
    long countByResolvedFalse();

    // Count by severity
    long countBySeverity(SecurityEvent.Severity severity);

    // Paginated search
    Page<SecurityEvent> findBySourceIpContainingOrDescriptionContainingIgnoreCase(
            String ip, String description, Pageable pageable);

    // Events for a specific IP
    List<SecurityEvent> findBySourceIpOrderByCreatedAtDesc(String sourceIp);

    // Critical unresolved events
    @Query("SELECT e FROM SecurityEvent e WHERE e.resolved = false AND e.severity IN ('HIGH', 'CRITICAL') ORDER BY e.createdAt DESC")
    List<SecurityEvent> findCriticalUnresolved();

    // ═══ ALL-TIME queries (no time filter) for Dashboard display ═══

    @Query("SELECT e.severity, COUNT(e) FROM SecurityEvent e GROUP BY e.severity")
    List<Object[]> countBySeverityAllTime();

    @Query("SELECT e.eventType, COUNT(e) FROM SecurityEvent e GROUP BY e.eventType ORDER BY COUNT(e) DESC")
    List<Object[]> countByEventTypeAllTime();

    @Query("SELECT e.sourceIp, COUNT(e) as cnt FROM SecurityEvent e WHERE e.sourceIp IS NOT NULL GROUP BY e.sourceIp ORDER BY cnt DESC")
    List<Object[]> topAttackingIPsAllTime(Pageable pageable);
}
