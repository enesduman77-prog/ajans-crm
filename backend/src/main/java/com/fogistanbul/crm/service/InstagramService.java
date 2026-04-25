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



        InsightRange range = resolveRange(rangeStart, rangeEnd);



        try {

            // 1. Profil bilgileri

            Map<String, Object> profile = fetchJson(

                    GRAPH_URL + "/" + igUserId + "?fields=followers_count,follows_count,media_count,username&access_token=" + accessToken);



            long followersCount = toLong(profile.get("followers_count"));

            long followsCount = toLong(profile.get("follows_count"));

            long mediaCount = toLong(profile.get("media_count"));

            String username = (String) profile.getOrDefault("username", token.getIgUsername());



            // 2. Insights: follower_count (günlük), impressions, reach, profile_views, website_clicks

            long since = range.since();

            long until = range.until();



            // follower_count → günlük takipçi sayısı

            List<Map<String, Object>> followerValues = fetchInsight(igUserId, accessToken,

                    "follower_count", "day", since, until);



            // Instagram Graph API v21 no longer accepts "impressions" here; "views" is the replacement.

            List<Map<String, Object>> viewValues = fetchTotalInsight(igUserId, accessToken,

                    "views", since, until);

            Map<String, Long> dailyViewsByDate = fetchDailyTotalInsightByDate(igUserId, accessToken,

                    "views", followerValues);

            List<Map<String, Object>> reachValues = fetchInsight(igUserId, accessToken,

                    "reach", "day", since, until);

            List<Map<String, Object>> profileViewValues = fetchTotalInsight(igUserId, accessToken,

                    "profile_views", since, until);

            List<Map<String, Object>> websiteClickValues = fetchTotalInsight(igUserId, accessToken,

                    "website_clicks", since, until);



            // Toplamlar

            long totalImpressions = sumInsightValues(viewValues);

            long totalReach = sumInsightValues(reachValues);

            long totalProfileViews = sumInsightValues(profileViewValues);

            long totalWebsiteClicks = sumInsightValues(websiteClickValues);



            // Takipçi kazanım/kayıp

            FollowStats followStats = fetchFollowStats(igUserId, accessToken, since, until);

            if (!followStats.available()) {

                InsightRange currentMonth = currentMonthRange();

                followStats = fetchFollowStats(igUserId, accessToken, currentMonth.since(), currentMonth.until());

            }

            long followersGained = followStats.gained();

            long followersLost = followStats.lost();

            if (!followStats.available() && followerValues.size() >= 2) {

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

                long dayImpressions = dailyViewsByDate.getOrDefault(date, 0L);

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

                ReelInsightStats insightStats = fetchReelInsights(mediaId, accessToken);



                rows.add(new IgReelRow(

                        mediaId,

                        truncate((String) reel.getOrDefault("caption", ""), 80),

                        (String) reel.getOrDefault("thumbnail_url", (String) reel.getOrDefault("media_url", "")),

                        (String) reel.getOrDefault("permalink", ""),

                        (String) reel.getOrDefault("timestamp", ""),

                        toLong(reel.get("like_count")),

                        toLong(reel.get("comments_count")),

                        insightStats.views(), insightStats.reach(), insightStats.saved(), insightStats.shares()

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

    private List<Map<String, Object>> fetchTotalInsight(String igUserId, String accessToken,

                                                        String metric,

                                                        long since, long until) {

        try {

            String url = GRAPH_URL + "/" + igUserId + "/insights"

                    + "?metric=" + metric

                    + "&metric_type=total_value"

                    + "&period=day"

                    + "&since=" + since

                    + "&until=" + until

                    + "&access_token=" + accessToken;



            Map<String, Object> result = fetchJson(url);

            List<Map<String, Object>> data = (List<Map<String, Object>>) result.get("data");

            if (data == null || data.isEmpty()) return List.of();



            Object totalValue = data.get(0).get("total_value");

            if (totalValue instanceof Map<?, ?> totalMap) {

                Object value = totalMap.get("value");

                return List.of(Map.of("value", value != null ? value : 0));

            }



            Object values = data.get(0).get("values");

            if (values instanceof List<?> list) {

                return (List<Map<String, Object>>) list;

            }



            return List.of();

        } catch (Exception e) {

            log.warn("Instagram total insight alÄ±namadÄ±, metric={}: {}", metric, e.getMessage());

            return List.of();

        }

    }



    private FollowStats fetchFollowStats(String igUserId, String accessToken, long since, long until) {

        String baseUrl = GRAPH_URL + "/" + igUserId + "/insights"

                + "?metric=follows_and_unfollows"

                + "&metric_type=total_value"

                + "&period=day"

                + "&since=" + since

                + "&until=" + until

                + "&access_token=" + accessToken;



        List<String> urls = List.of(

                baseUrl + "&breakdown=follow_type",

                baseUrl + "&breakdowns=follow_type"

        );



        String lastError = null;

        for (String url : urls) {

            try {

                FollowStats stats = parseFollowStats(fetchJson(url));

                if (stats.available()) {

                    return stats;

                }

            } catch (Exception e) {

                lastError = e.getMessage();

            }

        }



        if (lastError != null) {

            log.warn("Instagram takipci kazanimi/kaybi alinamadi: {}", lastError);

        }

        return FollowStats.unavailable();

    }



    private Map<String, Long> fetchDailyTotalInsightByDate(String igUserId, String accessToken,

                                                           String metric,

                                                           List<Map<String, Object>> trendRows) {

        Map<String, Long> dailyValues = new LinkedHashMap<>();

        ZoneId zone = ZoneId.of("Europe/Istanbul");



        for (Map<String, Object> row : trendRows) {

            String date = extractInsightDate(row);

            if (date.isBlank() || dailyValues.containsKey(date)) {

                continue;

            }



            try {

                LocalDate day = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);

                long daySince = day.atStartOfDay(zone).toEpochSecond();

                long dayUntil = day.plusDays(1).atStartOfDay(zone).toEpochSecond();

                long value = sumInsightValues(fetchTotalInsight(igUserId, accessToken, metric, daySince, dayUntil));

                dailyValues.put(date, value);

            } catch (Exception e) {

                log.debug("Instagram gunluk total insight alinamadi, metric={}, date={}: {}",

                        metric, date, e.getMessage());

                dailyValues.put(date, 0L);

            }

        }



        return dailyValues;

    }



    private String extractInsightDate(Map<String, Object> row) {

        Object endTime = row.get("end_time");

        if (endTime == null) {

            return "";

        }



        String value = endTime.toString();

        return value.length() >= 10 ? value.substring(0, 10) : value;

    }



    private FollowStats parseFollowStats(Map<String, Object> result) {

        long[] counts = new long[2];

        boolean[] found = new boolean[1];

        collectFollowStats(result, "", counts, found);

        return new FollowStats(counts[0], counts[1], found[0]);

    }



    @SuppressWarnings("unchecked")

    private void collectFollowStats(Object node, String label, long[] counts, boolean[] found) {

        if (node instanceof Map<?, ?> rawMap) {

            Map<String, Object> map = (Map<String, Object>) rawMap;

            Object value = map.get("value");

            Object followType = map.get("follow_type");

            if (followType != null && value != null) {

                addFollowStat(followType.toString(), value, counts, found);

            }



            Object dimensionValues = map.get("dimension_values");

            if (dimensionValues instanceof List<?> dims && value != null) {

                String dimensionLabel = String.join(" ", dims.stream().map(String::valueOf).toList());

                addFollowStat(dimensionLabel, value, counts, found);

            }



            for (Map.Entry<String, Object> entry : map.entrySet()) {

                collectFollowStats(entry.getValue(), entry.getKey(), counts, found);

            }

        } else if (node instanceof List<?> list) {

            for (Object item : list) {

                collectFollowStats(item, label, counts, found);

            }

        } else if (node instanceof Number || node instanceof String) {

            addFollowStat(label, node, counts, found);

        }

    }



    private void addFollowStat(String label, Object value, long[] counts, boolean[] found) {

        if (label == null || value == null) return;

        String normalized = label.toLowerCase(Locale.ROOT)

                .replace("-", "_")

                .replace(" ", "_");

        if (normalized.contains("follows_and_unfollows")) return;



        boolean lost = normalized.contains("unfollow")

                || normalized.contains("nonfollower")

                || normalized.contains("non_follower")

                || normalized.contains("lost");

        boolean gained = normalized.equals("follow")

                || normalized.equals("follows")

                || normalized.equals("follower")

                || normalized.equals("followers")

                || normalized.contains("new_follow")

                || (normalized.contains("follower") && !lost);



        if (!gained && !lost) return;



        long numeric = toLong(value);

        if (lost) {

            counts[1] += numeric;

        } else {

            counts[0] += numeric;

        }

        found[0] = true;

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



    private ReelInsightStats fetchReelInsights(String mediaId, String accessToken) {

        if (mediaId == null || mediaId.isBlank()) {

            return new ReelInsightStats(0, 0, 0, 0);

        }



        long views = firstAvailableReelMetric(mediaId, accessToken,

                List.of("plays", "views", "ig_reels_aggregated_all_plays_count", "video_views"));

        long reach = fetchMediaInsightValue(mediaId, accessToken, "reach").orElse(0);

        long saved = fetchMediaInsightValue(mediaId, accessToken, "saved").orElse(0);

        long shares = fetchMediaInsightValue(mediaId, accessToken, "shares").orElse(0);



        return new ReelInsightStats(views, reach, saved, shares);

    }



    private long firstAvailableReelMetric(String mediaId, String accessToken, List<String> metrics) {

        for (String metric : metrics) {

            OptionalLong value = fetchMediaInsightValue(mediaId, accessToken, metric);

            if (value.isPresent()) {

                return value.getAsLong();

            }

        }



        return 0;

    }



    private OptionalLong fetchMediaInsightValue(String mediaId, String accessToken, String metric) {

        List<String> urls = List.of(

                GRAPH_URL + "/" + mediaId + "/insights"

                        + "?metric=" + metric

                        + "&access_token=" + accessToken,

                GRAPH_URL + "/" + mediaId + "/insights"

                        + "?metric=" + metric

                        + "&metric_type=total_value"

                        + "&period=day"

                        + "&access_token=" + accessToken,

                GRAPH_URL + "/" + mediaId + "/insights"

                        + "?metric=" + metric

                        + "&period=day"

                        + "&access_token=" + accessToken

        );



        for (String url : urls) {

            try {

                OptionalLong value = parseSingleInsightValue(fetchJson(url), metric);

                if (value.isPresent()) {

                    return value;

                }

            } catch (Exception e) {

                log.debug("Reel insight adayi gecersiz, mediaId={}, metric={}: {}",

                        mediaId, metric, e.getMessage());

            }

        }



        return OptionalLong.empty();

    }



    @SuppressWarnings("unchecked")

    private OptionalLong parseSingleInsightValue(Map<String, Object> result, String metric) {

        Object dataObj = result.get("data");

        if (!(dataObj instanceof List<?> data)) {

            return OptionalLong.empty();

        }



        for (Object item : data) {

            if (!(item instanceof Map<?, ?> rawMap)) {

                continue;

            }



            Map<String, Object> insight = (Map<String, Object>) rawMap;

            Object name = insight.get("name");

            if (name != null && !metric.equalsIgnoreCase(name.toString())) {

                continue;

            }



            return OptionalLong.of(extractInsightValue(insight));

        }



        return OptionalLong.empty();

    }



    @SuppressWarnings("unchecked")

    private long extractInsightValue(Object insight) {

        if (insight instanceof Map<?, ?> rawMap) {

            Map<String, Object> map = (Map<String, Object>) rawMap;

            Object totalValue = map.get("total_value");

            if (totalValue != null) {

                return extractInsightValue(totalValue);

            }



            Object values = map.get("values");

            if (values != null) {

                return extractInsightValue(values);

            }



            Object value = map.get("value");

            if (value != null) {

                return extractInsightValue(value);

            }



            return 0;

        }



        if (insight instanceof List<?> list) {

            if (list.isEmpty()) {

                return 0;

            }



            return extractInsightValue(list.get(list.size() - 1));

        }



        return toLong(insight);

    }



    private long sumInsightValues(List<Map<String, Object>> values) {

        return values.stream().mapToLong(v -> toLong(v.get("value"))).sum();

    }



    private long toLong(Object val) {

        if (val == null) return 0;

        if (val instanceof Number n) return n.longValue();

        try { return Long.parseLong(val.toString()); } catch (Exception e) { return 0; }

    }



    private InsightRange resolveRange(String rangeStart, String rangeEnd) {

        ZoneId zone = ZoneId.of("Europe/Istanbul");

        Instant now = Instant.now();

        long until = parseEndInstant(rangeEnd, zone).orElse(now).getEpochSecond();

        long since = parseStartInstant(rangeStart, zone)

                .orElseGet(() -> now.minusSeconds((long) parseDays(rangeStart) * 86400))

                .getEpochSecond();



        if (since >= until) {

            since = now.minusSeconds(30L * 86400).getEpochSecond();

            until = now.getEpochSecond();

        }



        return new InsightRange(since, until);

    }



    private InsightRange currentMonthRange() {

        ZoneId zone = ZoneId.of("Europe/Istanbul");

        LocalDate firstDay = LocalDate.now(zone).withDayOfMonth(1);

        return new InsightRange(firstDay.atStartOfDay(zone).toEpochSecond(), Instant.now().getEpochSecond());

    }



    private Optional<Instant> parseStartInstant(String value, ZoneId zone) {

        if (value == null || value.isBlank() || value.endsWith("daysAgo")) return Optional.empty();

        try {

            return Optional.of(LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay(zone).toInstant());

        } catch (Exception ignored) {

            return Optional.empty();

        }

    }



    private Optional<Instant> parseEndInstant(String value, ZoneId zone) {

        if (value == null || value.isBlank() || "today".equalsIgnoreCase(value)) return Optional.empty();

        try {

            return Optional.of(LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE).plusDays(1).atStartOfDay(zone).toInstant());

        } catch (Exception ignored) {

            return Optional.empty();

        }

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



    private record InsightRange(long since, long until) {}



    private record ReelInsightStats(long views, long reach, long saved, long shares) {}



    private record FollowStats(long gained, long lost, boolean available) {

        private static FollowStats unavailable() {

            return new FollowStats(0, 0, false);

        }

    }



    private String truncate(String s, int max) {

        if (s == null) return "";

        return s.length() <= max ? s : s.substring(0, max) + "...";

    }

}

