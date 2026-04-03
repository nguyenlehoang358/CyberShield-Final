package com.myweb.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.myweb.entity.AuditLog;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop20ByOrderByTimestampDesc();

    List<AuditLog> findTop20BySeverityOrderByTimestampDesc(AuditLog.Severity severity);

    long countBySeverity(AuditLog.Severity severity);

    long countByTimestampAfter(Instant timestamp);
}
