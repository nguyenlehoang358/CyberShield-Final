package com.myweb.repository;

import java.util.Optional;
import java.util.List;

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

    List<BlockedIpHistory> findByIpAddress(String ipAddress);

    /**
     * Get the latest block record for an IP address.
     */
    Optional<BlockedIpHistory> findTopByIpAddressOrderByCreatedAtDesc(String ipAddress);
}
