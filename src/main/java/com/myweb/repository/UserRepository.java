package com.myweb.repository;

import com.myweb.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByOauthProviderAndOauthId(String provider, String oauthId);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
