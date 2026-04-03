package com.myweb.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.myweb.entity.User;
import com.myweb.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String indentifier) throws UsernameNotFoundException {
        // Try to find by username first, then by email
        User user = userRepository.findByUsername(indentifier)
                .or(() -> userRepository.findByEmail(indentifier))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + indentifier));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername()) // Use consistent username for principal
                .password(user.getPassword())
                .accountExpired(!user.isAccountNonExpired())
                .accountLocked(!user.isAccountNonLocked())
                .credentialsExpired(!user.isCredentialsNonExpired())
                .disabled(!user.isEnabled())
                .authorities(user.getRoles().stream()
                        .map(role -> "ROLE_" + role.getName().name().replace("ROLE_", ""))
                        .toArray(String[]::new))
                .build();
    }
}
