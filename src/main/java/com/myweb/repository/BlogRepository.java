package com.myweb.repository;

import com.myweb.entity.Blog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {
    boolean existsByUrl(String url);
    long countByPublishedTrue();
    Page<Blog> findAllByPublishedTrue(Pageable pageable);
}
