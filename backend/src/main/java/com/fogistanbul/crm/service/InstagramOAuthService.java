package com.fogistanbul.crm.service;



import com.fogistanbul.crm.entity.Company;

import com.fogistanbul.crm.entity.InstagramToken;

import com.fogistanbul.crm.repository.CompanyRepository;

import com.fogistanbul.crm.repository.InstagramTokenRepository;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;

import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.*;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.client.RestTemplate;

import org.springframework.web.util.UriComponentsBuilder;



import java.time.Instant;

import java.util.*;



@Service

@RequiredArgsConstructor

public class InstagramOAuthService {



    private static final Logger log = LoggerFactory.getLogger(InstagramOAuthService.class);



    private static final String AUTH_URL  = "https://www.facebook.com/v21.0/dialog/oauth";

    private static final String TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token";

    private static final String GRAPH_URL = "https://graph.facebook.com/v21.0";



    private static final String SCOPE = "pages_show_list,pages_read_engagement";



    @Value("${app.instagram.app-id:}")

    private String appId;



    @Value("${app.instagram.app-secret:}")

    private String appSecret;



    @Value("${app.instagram.redirect-uri:http://localhost:8080/api/oauth/instagram/callback}")

    private String redirectUri;



    @Value("${app.frontend-url:http://localhost:5173}")

    private String frontendUrl;



    private final InstagramTokenRepository tokenRepository;

    private final CompanyRepository companyRepository;

    private final RestTemplate restTemplate;



    public boolean isConfigured() {

        return appId != null && !appId.isBlank() && appSecret != null && !appSecret.isBlank();

    }



    public String buildAuthorizationUrl(UUID companyId) {

        return UriComponentsBuilder.fromHttpUrl(AUTH_URL)

                .queryParam("client_id", appId)

                .queryParam("redirect_uri", redirectUri)

                .queryParam("scope", SCOPE)

                .queryParam("response_type", "code")

                .queryParam("state", companyId.toString())

                .build()

                .toUriString();

    }



    @Transactional

    @SuppressWarnings("unchecked")

    public void handleCallback(String code, String state) {

        UUID companyId = UUID.fromString(state);



        // 1. Exchange code for short-lived token

        String shortLivedToken = exchangeCodeForToken(code);



        // 2. Exchange for long-lived token (60 days)

        Map<String, Object> longLived = exchangeForLongLivedToken(shortLivedToken);

        String accessToken = (String) longLived.get("access_token");

        Integer expiresIn = (Integer) longLived.get("expires_in");



        if (accessToken == null) {

            throw new IllegalStateException("Instagram long-lived token alınamadı");

        }



        Instant expiry = Instant.now().plusSeconds(expiresIn != null ? expiresIn : 5184000);



        // 3. Get user's Facebook pages and find Instagram business account

        Map<String, String> igInfo = findInstagramAccount(accessToken);



        Company company = companyRepository.findById(companyId)

                .orElseThrow(() -> new IllegalArgumentException("Şirket bulunamadı: " + companyId));



        // 4. Upsert token

        InstagramToken token = tokenRepository.findByCompanyId(companyId)

                .orElse(InstagramToken.builder().company(company).build());



        token.setAccessToken(accessToken);

        token.setTokenExpiry(expiry);

        token.setIgUserId(igInfo.get("igUserId"));

        token.setIgUsername(igInfo.get("username"));

        token.setPageId(igInfo.get("pageId"));



        tokenRepository.save(token);

        log.info("Instagram token kaydedildi, company={}, igUser={}", companyId, igInfo.get("username"));

    }



    @Transactional

    public Optional<String> getValidAccessToken(UUID companyId) {

        return tokenRepository.findByCompanyId(companyId).map(token -> {

            if (token.getTokenExpiry() != null &&

                Instant.now().isAfter(token.getTokenExpiry().minusSeconds(86400))) {

                // 1 gün kala yenile

                return refreshLongLivedToken(token);

            }

            return token.getAccessToken();

        });

    }



    @Transactional

    public void disconnect(UUID companyId) {

        tokenRepository.deleteByCompanyId(companyId);

        log.info("Instagram bağlantısı kaldırıldı, company={}", companyId);

    }



    public boolean isConnected(UUID companyId) {

        return tokenRepository.existsByCompanyId(companyId);

    }



    public Optional<InstagramToken> getToken(UUID companyId) {

        return tokenRepository.findByCompanyId(companyId);

    }



    public String getFrontendUrl() {

        return frontendUrl;

    }



    // ─── Yardımcı: code → short-lived token ───────────────────────────



    @SuppressWarnings("unchecked")

    private String exchangeCodeForToken(String code) {

        String url = UriComponentsBuilder.fromHttpUrl(TOKEN_URL)

                .queryParam("client_id", appId)

                .queryParam("client_secret", appSecret)

                .queryParam("redirect_uri", redirectUri)

                .queryParam("code", code)

                .build().toUriString();



        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {

            throw new IllegalStateException("Facebook token exchange hatası: " + response.getStatusCode());

        }

        String token = (String) response.getBody().get("access_token");

        if (token == null) throw new IllegalStateException("access_token boş döndü");

        return token;

    }



    // ─── Yardımcı: short-lived → long-lived token ─────────────────────



    @SuppressWarnings("unchecked")

    private Map<String, Object> exchangeForLongLivedToken(String shortLivedToken) {

        String url = UriComponentsBuilder.fromHttpUrl(GRAPH_URL + "/oauth/access_token")

                .queryParam("grant_type", "fb_exchange_token")

                .queryParam("client_id", appId)

                .queryParam("client_secret", appSecret)

                .queryParam("fb_exchange_token", shortLivedToken)

                .build().toUriString();



        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {

            throw new IllegalStateException("Long-lived token exchange hatası");

        }

        return response.getBody();

    }



    // ─── Yardımcı: Facebook pages → Instagram Business IG User ID ────



    @SuppressWarnings("unchecked")

    private Map<String, String> findInstagramAccount(String accessToken) {

        // Get user's pages

        String pagesUrl = GRAPH_URL + "/me/accounts?fields=id,name,instagram_business_account&access_token=" + accessToken;

        ResponseEntity<Map> pagesResponse = restTemplate.getForEntity(pagesUrl, Map.class);



        if (pagesResponse.getBody() == null) {

            throw new IllegalStateException("Facebook sayfaları alınamadı");

        }



        List<Map<String, Object>> pages = (List<Map<String, Object>>) pagesResponse.getBody().get("data");

        if (pages == null || pages.isEmpty()) {

            throw new IllegalStateException("Hiçbir Facebook sayfası bulunamadı. Lütfen bir Facebook sayfanız olduğundan emin olun.");

        }



        // İlk Instagram Business hesabını bul

        for (Map<String, Object> page : pages) {

            Map<String, Object> igAccount = (Map<String, Object>) page.get("instagram_business_account");

            if (igAccount != null) {

                String igUserId = (String) igAccount.get("id");

                String pageId = (String) page.get("id");



                // Get IG username

                String igUrl = GRAPH_URL + "/" + igUserId + "?fields=username&access_token=" + accessToken;

                ResponseEntity<Map> igResponse = restTemplate.getForEntity(igUrl, Map.class);

                String username = "";

                if (igResponse.getBody() != null) {

                    username = (String) igResponse.getBody().getOrDefault("username", "");

                }



                return Map.of("igUserId", igUserId, "pageId", pageId, "username", username);

            }

        }



        throw new IllegalStateException("Hiçbir Facebook sayfasına bağlı Instagram Business hesabı bulunamadı. " +

                "Instagram hesabınızın Business veya Creator hesap olduğundan ve bir Facebook sayfasına bağlı olduğundan emin olun.");

    }



    // ─── Yardımcı: long-lived token yenile ───────────────────────────



    @SuppressWarnings("unchecked")

    private String refreshLongLivedToken(InstagramToken token) {

        try {

            String url = GRAPH_URL + "/oauth/access_token?grant_type=fb_exchange_token"

                    + "&client_id=" + appId

                    + "&client_secret=" + appSecret

                    + "&fb_exchange_token=" + token.getAccessToken();



            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {

                String newToken = (String) response.getBody().get("access_token");

                Integer expiresIn = (Integer) response.getBody().get("expires_in");

                if (newToken != null) {

                    token.setAccessToken(newToken);

                    token.setTokenExpiry(Instant.now().plusSeconds(expiresIn != null ? expiresIn : 5184000));

                    tokenRepository.save(token);

                    return newToken;

                }

            }

        } catch (Exception e) {

            log.error("Instagram token yenileme hatası, companyId={}: {}", token.getCompany().getId(), e.getMessage());

        }

        return token.getAccessToken();

    }

}

