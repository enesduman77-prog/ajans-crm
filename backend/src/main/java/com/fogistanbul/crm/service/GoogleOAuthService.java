package com.fogistanbul.crm.service;

import com.fogistanbul.crm.entity.Company;
import com.fogistanbul.crm.entity.GoogleOAuthToken;
import com.fogistanbul.crm.repository.CompanyRepository;
import com.fogistanbul.crm.repository.GoogleOAuthTokenRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleOAuthService.class);

    private static final String AUTH_URL      = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_URL     = "https://oauth2.googleapis.com/token";
    private static final String SCOPE         = "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly";

    @Value("${app.google-oauth.client-id}")
    private String clientId;

    @Value("${app.google-oauth.client-secret}")
    private String clientSecret;

    @Value("${app.google-oauth.redirect-uri}")
    private String redirectUri;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private final GoogleOAuthTokenRepository tokenRepository;
    private final CompanyRepository companyRepository;
    private final RestTemplate restTemplate;

    // ─── Authorization URL ────────────────────────────────────────────────────

    /**
     * Müşterinin Google hesabına yönlendirileceği OAuth URL'ini üretir.
     * state parametresi = companyId (callback'te hangi şirkete ait olduğunu anlamak için)
     */
    public String buildAuthorizationUrl(UUID companyId) {
        return UriComponentsBuilder.fromHttpUrl(AUTH_URL)
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", SCOPE)
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")     // her zaman refresh_token gelsin
                .queryParam("state", companyId.toString())
                .build()
                .toUriString();
    }

    // ─── Callback: code → token exchange ─────────────────────────────────────

    @Transactional
    public void handleCallback(String code, String state) {
        UUID companyId = UUID.fromString(state);

        // Token exchange
        Map<String, Object> tokenResponse = exchangeCodeForTokens(code);

        String accessToken  = (String) tokenResponse.get("access_token");
        String refreshToken = (String) tokenResponse.get("refresh_token");
        Integer expiresIn   = (Integer) tokenResponse.get("expires_in");
        String scope        = (String) tokenResponse.get("scope");

        if (accessToken == null || refreshToken == null) {
            throw new IllegalStateException("Google token exchange başarısız: access_token veya refresh_token eksik");
        }

        Instant expiry = Instant.now().plusSeconds(expiresIn != null ? expiresIn : 3600);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Şirket bulunamadı: " + companyId));

        // Upsert
        GoogleOAuthToken token = tokenRepository.findByCompanyId(companyId)
                .orElse(GoogleOAuthToken.builder().company(company).build());

        token.setAccessToken(accessToken);
        token.setRefreshToken(refreshToken);
        token.setTokenExpiry(expiry);
        token.setScope(scope);

        tokenRepository.save(token);
        log.info("GA OAuth token kaydedildi, company={}", companyId);
    }

    // ─── Token erişimi (refresh gerekirse otomatik yenile) ────────────────────

    @Transactional
    public Optional<String> getValidAccessToken(UUID companyId) {
        return tokenRepository.findByCompanyId(companyId).map(token -> {
            // Süresi dolmuş veya 60 saniye içinde dolacaksa yenile
            if (Instant.now().isAfter(token.getTokenExpiry().minusSeconds(60))) {
                return refreshAccessToken(token);
            }
            return token.getAccessToken();
        });
    }

    // ─── GA Property ID güncelle ─────────────────────────────────────────────

    @Transactional
    public void savePropertyId(UUID companyId, String propertyId) {
        tokenRepository.findByCompanyId(companyId).ifPresent(token -> {
            token.setGaPropertyId(propertyId);
            tokenRepository.save(token);
        });
    }

    // ─── Search Console Site URL güncelle ──────────────────────────────────────

    @Transactional
    public void saveSiteUrl(UUID companyId, String siteUrl) {
        tokenRepository.findByCompanyId(companyId).ifPresent(token -> {
            token.setScSiteUrl(siteUrl);
            tokenRepository.save(token);
        });
    }

    public Optional<String> getSiteUrl(UUID companyId) {
        return tokenRepository.findByCompanyId(companyId)
                .map(GoogleOAuthToken::getScSiteUrl);
    }

    // ─── Bağlantıyı kes ──────────────────────────────────────────────────────

    @Transactional
    public void disconnect(UUID companyId) {
        tokenRepository.deleteByCompanyId(companyId);
        log.info("Google bağlantısı kaldırıldı, company={}", companyId);
    }

    // ─── Bağlantı durumu ─────────────────────────────────────────────────────

    public boolean isConnected(UUID companyId) {
        return tokenRepository.existsByCompanyId(companyId);
    }

    public Optional<String> getPropertyId(UUID companyId) {
        return tokenRepository.findByCompanyId(companyId)
                .map(GoogleOAuthToken::getGaPropertyId);
    }

    public boolean hasScScope(UUID companyId) {
        return tokenRepository.findByCompanyId(companyId)
                .map(token -> token.getScope() != null && token.getScope().contains("webmasters"))
                .orElse(false);
    }

    // ─── Yardımcı: token exchange ─────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> exchangeCodeForTokens(String code) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> response = restTemplate.exchange(
                TOKEN_URL, HttpMethod.POST,
                new HttpEntity<>(params, headers),
                Map.class
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Google token exchange HTTP hatası: " + response.getStatusCode());
        }
        return response.getBody();
    }

    // ─── Yardımcı: access token yenile ───────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String refreshAccessToken(GoogleOAuthToken token) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("refresh_token", token.getRefreshToken());
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("grant_type", "refresh_token");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    TOKEN_URL, HttpMethod.POST,
                    new HttpEntity<>(params, headers),
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                String newAccessToken = (String) body.get("access_token");
                Integer expiresIn = (Integer) body.get("expires_in");

                token.setAccessToken(newAccessToken);
                token.setTokenExpiry(Instant.now().plusSeconds(expiresIn != null ? expiresIn : 3600));
                tokenRepository.save(token);
                return newAccessToken;
            }
        } catch (Exception e) {
            log.error("Access token yenileme hatası, companyId={}: {}", token.getCompany().getId(), e.getMessage());
        }
        return token.getAccessToken();
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }
}
