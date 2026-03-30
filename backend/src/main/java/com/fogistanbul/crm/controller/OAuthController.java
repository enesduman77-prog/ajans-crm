package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.service.GoogleOAuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

/**
 * Google OAuth 2.0 callback endpoint.
 * Bu endpoint herkese açık (permitAll) — JWT gerektirmez.
 * Google, kullanıcıyı buraya yönlendirir.
 */
@RestController
@RequestMapping("/api/oauth/google")
@RequiredArgsConstructor
public class OAuthController {

    private static final Logger log = LoggerFactory.getLogger(OAuthController.class);

    private final GoogleOAuthService googleOAuthService;

    /**
     * Google'dan dönen callback.
     * ?code=...&state=<companyId>
     */
    @GetMapping("/callback")
    public void callback(@RequestParam String code,
                         @RequestParam String state,
                         HttpServletResponse response) throws IOException {
        try {
            googleOAuthService.handleCallback(code, state);
            // Başarılı: frontend'in GA sayfasına yönlendir
            response.sendRedirect(googleOAuthService.getFrontendUrl()
                    + "/client/analytics?ga=connected");
        } catch (Exception e) {
            log.error("OAuth callback hatası: {}", e.getMessage(), e);
            response.sendRedirect(googleOAuthService.getFrontendUrl()
                    + "/client/analytics?ga=error&message=" + e.getMessage());
        }
    }
}
