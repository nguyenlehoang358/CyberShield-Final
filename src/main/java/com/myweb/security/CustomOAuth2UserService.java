package com.myweb.security;

import java.util.Map;
import java.util.Optional;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.myweb.entity.ERole;
import com.myweb.entity.Role;
import com.myweb.entity.User;
import com.myweb.repository.RoleRepository;
import com.myweb.repository.UserRepository;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;

    public CustomOAuth2UserService(UserRepository userRepository, RoleRepository roleRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        String provider = userRequest.getClientRegistration().getRegistrationId();
        return processOAuth2User(provider, oauth2User);
    }

    private OAuth2User processOAuth2User(String provider, OAuth2User oauth2User) {
        Map<String, Object> attributes = oauth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String id = null;
        String avatarUrl = null;

        // 1. XỬ LÝ ẢNH ĐẠI DIỆN AN TOÀN (Chống lỗi Facebook)
        Object pictureObj = attributes.get("picture");
        if (pictureObj instanceof String) {
            avatarUrl = (String) pictureObj; // Google trả về String
        } else if (pictureObj instanceof Map) {
            // Facebook trả về Map: { data: { url: "..." } }
            Map<?, ?> pictureMap = (Map<?, ?>) pictureObj;
            if (pictureMap.containsKey("data")) {
                Map<?, ?> dataMap = (Map<?, ?>) pictureMap.get("data");
                if (dataMap.containsKey("url")) {
                    avatarUrl = (String) dataMap.get("url");
                }
            }
        } else {
            avatarUrl = (String) attributes.get("avatar_url"); // GitHub trả về avatar_url
        }

        // 2. XỬ LÝ ID VÀ EMAIL FALLBACK
        if (provider.equals("github")) {
            id = String.valueOf(attributes.get("id"));
            if (email == null) {
                email = attributes.get("login") + "@github.com";
            }
            if (name == null) {
                name = (String) attributes.get("login");
            }
        } else if (provider.equals("facebook")) {
            id = String.valueOf(attributes.get("id"));
            if (email == null) {
                email = id + "@facebook.com"; // Tự tạo email ảo nếu Facebook giấu
            }
        } else if (provider.equals("linkedin")) {
            id = (String) attributes.get("sub");
        } else {
            id = (String) attributes.get("sub");
            if (id == null) id = String.valueOf(attributes.get("id"));
        }

        // Đường lùi cuối cùng, tuyệt đối không ném Exception ở đây nữa
        if (email == null || email.isEmpty()) {
            email = id + "@" + provider + ".com";
        }

        // --- BẮT QUÁ TRÌNH LIÊN KẾT TÀI KHOẢN TỪ COOKIE TẠM ---
        String linkAccessToken = null;
        org.springframework.web.context.request.ServletRequestAttributes attr = 
            (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            
        if (attr != null && attr.getRequest() != null) {
            jakarta.servlet.http.Cookie[] cookies = attr.getRequest().getCookies();
            if (cookies != null) {
                for (jakarta.servlet.http.Cookie c : cookies) {
                    if ("link_access_token".equals(c.getName())) {
                        linkAccessToken = c.getValue();
                        break;
                    }
                }
            }
        }

        // Nếu CÓ JWT hợp lệ: Đây là luồng LIÊN KẾT
        if (linkAccessToken != null && jwtUtil.validateToken(linkAccessToken)) {
            String usernameFromToken = jwtUtil.getUsernameFromToken(linkAccessToken);
            Optional<User> currentUserOpt = userRepository.findByUsername(usernameFromToken);
            if (currentUserOpt.isPresent()) {
                User currentUser = currentUserOpt.get();
                currentUser.setOauthProvider(provider);
                currentUser.setOauthId(id);
                currentUser.setOauthEmail(email); // Lưu email từ Google/GitHub
                if (avatarUrl != null && !avatarUrl.equals(currentUser.getAvatarUrl())) {
                    currentUser.setAvatarUrl(avatarUrl);
                }
                userRepository.save(currentUser);
                return oauth2User;
            }
        }

        // 3. LƯU VÀO DATABASE CHO LUỒNG ĐĂNG NHẬP/ĐĂNG KÝ MỚI
        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            boolean updated = false;

            if (user.getOauthProvider() == null || !user.getOauthProvider().equals(provider)) {
                user.setOauthProvider(provider);
                user.setOauthId(id);
                user.setOauthEmail(email);
                updated = true;
            }
            if (avatarUrl != null && !avatarUrl.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(avatarUrl);
                updated = true;
            }
            if (updated) {
                userRepository.save(user);
            }
        } else {
            user = new User();
            user.setEmail(email);
            
            // Xử lý an toàn username
            String baseUsername = email.contains("@") ? email.split("@")[0] : name;
            if (baseUsername == null || baseUsername.isEmpty()) baseUsername = "user" + id;
            user.setUsername(baseUsername);

            if (userRepository.existsByUsername(user.getUsername())) {
                user.setUsername(user.getUsername() + "_" + provider);
            }

            user.setOauthProvider(provider);
            user.setOauthId(id);
            user.setOauthEmail(email);
            user.setPassword("");
            user.setAvatarUrl(avatarUrl);

            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            user.addRole(userRole);

            userRepository.save(user);
        }

        return oauth2User;
    }
}