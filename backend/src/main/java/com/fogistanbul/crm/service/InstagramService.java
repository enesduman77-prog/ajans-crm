package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.IgOverviewResponse;
import com.fogistanbul.crm.dto.IgOverviewResponse.IgDailyRow;
import com.fogistanbul.crm.dto.IgOverviewResponse.IgMediaRow;
import com.fogistanbul.crm.dto.IgOverviewResponse.IgReelRow;
import com.fogistanbul.crm.entity.InstagramToken;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InstagramService {

    private static final Logger log = LoggerFactory.getLogger(InstagramService.class);
    private static final String GRAPH_URL = "https://graph.facebook.com/v21.0";

    private final InstagramOAuthService oAuthService;
    private final RestTemplate restTemplate;

    @SuppressWarnings("unchecked")
    public IgOverviewResponse getOverview(UUID companyId, String rangeStart, String rangeEnd) {
        Optional<InstagramToken> tokenOpt = oAuthService.getToken(companyId);
        if (tokenOpt.isEmpty()) return IgOverviewResponse.disabled();

        InstagramToken token = tokenOpt.get();
        String igUserId = token.getIgUserId();
        if (igUserId == null || igUserId.isBlank()) {
            return IgOverviewResponse.disabled();
        }

        String accessToken = oAuthService.getValidAccessToken(companyId).orElse(null);
        if (accessToken == null) return IgOverviewResponse.disabled();

        int days = parseDays(rangeStart);

        try {
            // 1. Profil bilgileri
            Map<String, Object> profile = fetchJson(
                    GRAPH_URL + "/" + igUserId + "?fields=followers_count,follows_count,media_count,username&access_token=" + accessToken);

            long followersCount = toLong(profile.get("followers_count"));
            long followsCount = toLong(profile.get("follows_count"));
            long mediaCount = toLong(profile.get("media_count"));
            String username = (String) profile.getOrDefault("username", token.getIgUsername());

            // 2. Insights: follower_count (günlük), impressions, reach, profile_views, website_clicks
            long since = Instant.now().minusSeconds((long) days * 86400).getEpochSecond();
            long until = Instant.now().getEpochSecond();

            // follower_count → günlük takipçi sayısı
            List<Map<String, Object>> followerValues = fetchInsight(igUserId, accessToken,
                    "follower_count", "day", since, until);

            // impressions, reach, profile_views
            List<Map<String, Object>> impressionValues = fetchInsight(igUserId, accessToken,
                    "impressions", "day", since, until);
            List<Map<String, Object>> reachValues = fetchInsight(igUserId, accessToken,
                    "reach", "day", since, until);
            List<Map<String, Object>> profileViewValues = fetchInsight(igUserId, accessToken,
                    "profile_views", "day", since, until);
            List<Map<String, Object>> websiteClickValues = fetchInsight(igUserId, accessToken,
                    "website_clicks", "day", since, until);

            // Toplamlar
            long totalImpressions = sumInsightValues(impressionValues);
            long totalReach = sumInsightValues(reachValues);
            long totalProfileViews = sumInsightValues(profileViewValues);
            long totalWebsiteClicks = sumInsightValues(websiteClickValues);

            // Takipçi kazanım/kayıp
            long followersGained = 0;
            long followersLost = 0;
            if (followerValues.size() >= 2) {
                long first = toLong(followerValues.get(0).get("value"));
                long last = toLong(followerValues.get(followerValues.size() - 1).get("value"));
                long diff = last - first;
                followersGained = Math.max(0, diff);
                followersLost = Math.abs(Math.min(0, diff));
            }

            // Günlük trend
            List<IgDailyRow> dailyTrend = new ArrayList<>();
            for (int i = 0; i < followerValues.size(); i++) {
                String endTime = (String) followerValues.get(i).get("end_time");
                String date = endTime != null ? endTime.substring(0, 10) : "";
                long followers = toLong(followerValues.get(i).get("value"));
                long dayImpressions = i < impressionValues.size() ? toLong(impressionValues.get(i).get("value")) : 0;
                long dayReach = i < reachValues.size() ? toLong(reachValues.get(i).get("value")) : 0;
                dailyTrend.add(new IgDailyRow(date, followers, dayImpressions, dayReach));
            }

            // 3. Son paylaşımlar + beğeni/yorum
            List<IgMediaRow> recentMedia = fetchRecentMedia(igUserId, accessToken, 12);

            long totalLikes = recentMedia.stream().mapToLong(IgMediaRow::likeCount).sum();
            long totalComments = recentMedia.stream().mapToLong(IgMediaRow::commentsCount).sum();

            return new IgOverviewResponse(
                    true, username, null,
                    followersCount, followsCount, mediaCount,
                    totalImpressions, totalReach, totalProfileViews, totalWebsiteClicks,
                    totalLikes, totalComments,
                    followersGained, followersLost,
                    dailyTrend, recentMedia
            );

        } catch (Exception e) {
            log.error("Instagram overview hatası, companyId={}: {}", companyId, e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : "";
            // Token geçersiz/iptal edilmiş — otomatik bağlantı kes
            if (msg.contains("\"code\":200") || msg.contains("API access blocked")
                    || msg.contains("OAuthException") || msg.contains("Invalid OAuth")) {
                log.warn("Instagram token geçersiz, bağlantı siliniyor companyId={}", companyId);
                oAuthService.disconnect(companyId);
                return IgOverviewResponse.disabled();
            }
            return new IgOverviewResponse(
                    true, token.getIgUsername(),
                    "Instagram API hatası: " + e.getMessage(),
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    List.of(), List.of()
            );
        }
    }

    // ─── Reels ────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public List<IgReelRow> getReels(UUID companyId, int limit) {
        Optional<InstagramToken> tokenOpt = oAuthService.getToken(companyId);
        if (tokenOpt.isEmpty()) return List.of();

        InstagramToken token = tokenOpt.get();
        String igUserId = token.getIgUserId();
        if (igUserId == null || igUserId.isBlank()) return List.of();

        String accessToken = oAuthService.getValidAccessToken(companyId).orElse(null);
        if (accessToken == null) return List.of();

        try {
            // Fetch recent media with media_product_type to identify reels
            String url = GRAPH_URL + "/" + igUserId + "/media"
                    + "?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count"
                    + "&limit=50"
                    + "&access_token=" + accessToken;

            Map<String, Object> result = fetchJson(url);
            List<Map<String, Object>> data = (List<Map<String, Object>>) result.get("data");
            if (data == null) return List.of();

            // Filter reels only
            List<Map<String, Object>> reels = data.stream()
                    .filter(m -> "REELS".equalsIgnoreCase((String) m.get("media_product_type")))
                    .limit(limit)
                    .toList();

            List<IgReelRow> rows = new ArrayList<>();
            for (Map<String, Object> reel : reels) {
                String mediaId = (String) reel.getOrDefault("id", "");
                long plays = 0, reach = 0, saved = 0, shares = 0;

                // Fetch per-reel insights
                try {
                    String insightUrl = GRAPH_URL + "/" + mediaId + "/insights"
                            + "?metric=plays,reach,saved,shares"
                            + "&access_token=" + accessToken;
                    Map<String, Object> insightResult = fetchJson(insightUrl);
                    List<Map<String, Object>> insightData = (List<Map<String, Object>>) insightResult.get("data");
                    if (insightData != null) {
                        for (Map<String, Object> insight : insightData) {
                            String name = (String) insight.get("name");
                            long val = toLong(insight.get("values") instanceof List<?> vals && !vals.isEmpty()
                                    ? ((Map<String, Object>) vals.get(0)).get("value")
                                    : insight.get("values"));
                            switch (name != null ? name : "") {
                                case "plays" -> plays = val;
                                case "reach" -> reach = val;
                                case "saved" -> saved = val;
                                case "shares" -> shares = val;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Reel insight alınamadı, mediaId={}: {}", mediaId, e.getMessage());
                }

                rows.add(new IgReelRow(
                        mediaId,
                        truncate((String) reel.getOrDefault("caption", ""), 80),
                        (String) reel.getOrDefault("thumbnail_url", (String) reel.getOrDefault("media_url", "")),
                        (String) reel.getOrDefault("permalink", ""),
                        (String) reel.getOrDefault("timestamp", ""),
                        toLong(reel.get("like_count")),
                        toLong(reel.get("comments_count")),
                        plays, reach, saved, shares
                ));
            }
            return rows;
        } catch (Exception e) {
            log.error("Instagram reels hatası, companyId={}: {}", companyId, e.getMessage());
            return List.of();
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchInsight(String igUserId, String accessToken,
                                                    String metric, String period,
                                                    long since, long until) {
        try {
            String url = GRAPH_URL + "/" + igUserId + "/insights"
                    + "?metric=" + metric
                    + "&period=" + period
                    + "&since=" + since
                    + "&until=" + until
                    + "&access_token=" + accessToken;

            Map<String, Object> result = fetchJson(url);
            List<Map<String, Object>> data = (List<Map<String, Object>>) result.get("data");
            if (data == null || data.isEmpty()) return List.of();

            return (List<Map<String, Object>>) data.get(0).get("values");
        } catch (Exception e) {
            log.warn("Instagram insight alınamadı, metric={}: {}", metric, e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<IgMediaRow> fetchRecentMedia(String igUserId, String accessToken, int limit) {
        try {
            String url = GRAPH_URL + "/" + igUserId + "/media"
                    + "?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count"
                    + "&limit=" + limit
                    + "&access_token=" + accessToken;

            Map<String, Object> result = fetchJson(url);
            List<Map<String, Object>> data = (List<Map<String, Object>>) result.get("data");
            if (data == null) return List.of();

            List<IgMediaRow> media = new ArrayList<>();
            for (Map<String, Object> m : data) {
                media.add(new IgMediaRow(
                        (String) m.getOrDefault("id", ""),
                        truncate((String) m.getOrDefault("caption", ""), 120),
                        (String) m.getOrDefault("media_type", ""),
                        (String) m.getOrDefault("media_url", ""),
                        (String) m.getOrDefault("permalink", ""),
                        (String) m.getOrDefault("timestamp", ""),
                        toLong(m.get("like_count")),
                        toLong(m.get("comments_count"))
                ));
            }
            return media;
        } catch (Exception e) {
            log.warn("Instagram media alınamadı: {}", e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchJson(String url) {
        ResponseEntity<Map> response = restTemplate.exchange(
                URI.create(url), HttpMethod.GET, null, Map.class);
        return response.getBody() != null ? response.getBody() : Map.of();
    }

    private long sumInsightValues(List<Map<String, Object>> values) {
        return values.stream().mapToLong(v -> toLong(v.get("value"))).sum();
    }

    private long toLong(Object val) {
        if (val == null) return 0;
        if (val instanceof Number n) return n.longValue();
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return 0; }
    }

    private int parseDays(String rangeStart) {
        if (rangeStart == null) return 30;
        try {
            String num = rangeStart.replaceAll("[^0-9]", "");
            return num.isEmpty() ? 30 : Integer.parseInt(num);
        } catch (Exception e) {
            return 30;
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
