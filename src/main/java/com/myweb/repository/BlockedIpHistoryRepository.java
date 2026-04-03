package com.myweb.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.myweb.entity.BlockedIpHistory;

public interface BlockedIpHistoryRepository extends JpaRepository<BlockedIpHistory, Long> {
    Page<BlockedIpHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT b FROM BlockedIpHistory b WHERE b.ipAddress LIKE %:query% OR b.reason LIKE %:query% ORDER BY b.createdAt DESC")
    Page<BlockedIpHistory> searchByIpOrReason(@Param("query") String query, Pageable pageable);

    java.util.List<BlockedIpHistory> findByIpAddress(String ipAddress);
}
