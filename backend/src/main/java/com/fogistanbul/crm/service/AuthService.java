package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.AuthResponse;
import com.fogistanbul.crm.dto.LoginRequest;
import com.fogistanbul.crm.entity.CompanyMembership;
import com.fogistanbul.crm.entity.RefreshToken;
import com.fogistanbul.crm.entity.UserProfile;
import com.fogistanbul.crm.repository.CompanyMembershipRepository;
import com.fogistanbul.crm.repository.RefreshTokenRepository;
import com.fogistanbul.crm.repository.UserProfileRepository;
import com.fogistanbul.crm.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

        private final UserProfileRepository userProfileRepository;
        private final RefreshTokenRepository refreshTokenRepository;
        private final CompanyMembershipRepository companyMembershipRepository;
        private final JwtTokenProvider jwtTokenProvider;
        private final PasswordEncoder passwordEncoder;

        @Value("${app.jwt.refresh-token-expiration-ms}")
        private long refreshTokenExpirationMs;

        @Transactional
        public AuthResponse login(LoginRequest request) {
                UserProfile user = userProfileRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("Geçersiz email veya şifre"));

                if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                        throw new RuntimeException("Geçersiz email veya şifre");
                }

                String accessToken = jwtTokenProvider.generateAccessToken(
                                user.getId(), user.getEmail(), user.getGlobalRole().name());
                String refreshTokenStr = jwtTokenProvider.generateRefreshToken(user.getId());

                storeRefreshToken(refreshTokenStr, user);

                return buildAuthResponse(user, accessToken, refreshTokenStr);
        }

        @Transactional
        public AuthResponse refreshToken(String refreshTokenStr) {
                if (!jwtTokenProvider.validateToken(refreshTokenStr)) {
                        throw new RuntimeException("Geçersiz refresh token");
                }

                String tokenHash = hashToken(refreshTokenStr);
                RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
                                .orElseThrow(() -> new RuntimeException("Geçersiz refresh token"));

                // Revoke old token (rotation)
                stored.setRevoked(true);
                refreshTokenRepository.save(stored);

                UUID userId = jwtTokenProvider.getUserIdFromToken(refreshTokenStr);
                UserProfile user = userProfileRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

                String newAccessToken = jwtTokenProvider.generateAccessToken(
                                user.getId(), user.getEmail(), user.getGlobalRole().name());
                String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

                storeRefreshToken(newRefreshToken, user);

                return buildAuthResponse(user, newAccessToken, newRefreshToken);
        }

        @Transactional
        public void revokeRefreshToken(String refreshTokenStr) {
                if (refreshTokenStr != null && jwtTokenProvider.validateToken(refreshTokenStr)) {
                        String tokenHash = hashToken(refreshTokenStr);
                        refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
                                        .ifPresent(token -> {
                                                token.setRevoked(true);
                                                refreshTokenRepository.save(token);
                                        });
                }
        }

        @Transactional(readOnly = true)
        public AuthResponse.UserInfo getCurrentUser(UUID userId) {
                UserProfile user = userProfileRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
                return buildUserInfo(user);
        }

        @Transactional
        @Scheduled(fixedRate = 3600000) // every hour
        public void cleanupExpiredTokens() {
                refreshTokenRepository.deleteExpiredAndRevoked(Instant.now());
        }

        private void storeRefreshToken(String tokenStr, UserProfile user) {
                RefreshToken token = RefreshToken.builder()
                                .tokenHash(hashToken(tokenStr))
                                .user(user)
                                .expiresAt(Instant.now().plusMillis(refreshTokenExpirationMs))
                                .build();
                refreshTokenRepository.save(token);
        }

        private AuthResponse buildAuthResponse(UserProfile user, String accessToken, String refreshToken) {
                return AuthResponse.builder()
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
                                .user(buildUserInfo(user))
                                .build();
        }

        private AuthResponse.UserInfo buildUserInfo(UserProfile user) {
                String fullName = user.getPerson() != null ? user.getPerson().getFullName() : user.getEmail();
                String avatarUrl = user.getPerson() != null ? user.getPerson().getAvatarUrl() : null;

                String membershipRole = null;
                if (user.getGlobalRole() == com.fogistanbul.crm.entity.enums.GlobalRole.COMPANY_USER) {
                        java.util.List<CompanyMembership> memberships = companyMembershipRepository.findByUserId(user.getId());
                        if (!memberships.isEmpty()) {
                                membershipRole = memberships.get(0).getMembershipRole().name();
                        }
                }

                return AuthResponse.UserInfo.builder()
                                .id(user.getId().toString())
                                .email(user.getEmail())
                                .fullName(fullName)
                                .globalRole(user.getGlobalRole().name())
                                .membershipRole(membershipRole)
                                .avatarUrl(avatarUrl)
                                .build();
        }

        private String hashToken(String token) {
                try {
                        MessageDigest digest = MessageDigest.getInstance("SHA-256");
                        byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
                        StringBuilder hexString = new StringBuilder(64);
                        for (byte b : hash) {
                                String hex = Integer.toHexString(0xff & b);
                                if (hex.length() == 1) hexString.append('0');
                                hexString.append(hex);
                        }
                        return hexString.toString();
                } catch (NoSuchAlgorithmException e) {
                        throw new RuntimeException("SHA-256 not available", e);
                }
        }
}
