package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.service.InstagramOAuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/oauth/instagram")
@RequiredArgsConstructor
public class InstagramOAuthController {

    private static final Logger log = LoggerFactory.getLogger(InstagramOAuthController.class);

    private final InstagramOAuthService instagramOAuthService;

    @GetMapping("/callback")
    public void callback(@RequestParam String code,
                         @RequestParam String state,
                         HttpServletResponse response) throws IOException {
        try {
            instagramOAuthService.handleCallback(code, state);
            response.sendRedirect(instagramOAuthService.getFrontendUrl()
                    + "/client/analytics?ig=connected");
        } catch (Exception e) {
            log.error("Instagram OAuth callback hatası: {}", e.getMessage(), e);
            String msg = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(instagramOAuthService.getFrontendUrl()
                    + "/client/analytics?ig=error&message=" + msg);
        }
    }
}
