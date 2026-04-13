package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.ScOverviewResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SearchConsoleService {

    private static final Logger log = LoggerFactory.getLogger(SearchConsoleService.class);
    private static final String SC_API_BASE = "https://www.googleapis.com/webmasters/v3/sites/";
    private static final String SC_SITES_LIST = "https://www.googleapis.com/webmasters/v3/sites";
    private static final String DEFAULT_START = "30daysAgo";
    private static final String DEFAULT_END = "today";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final GoogleOAuthService oAuthService;
    private final RestTemplate restTemplate;

    public boolean isConfigured(UUID companyId) {
        return oAuthService.isConnected(companyId)
                && oAuthService.getSiteUrl(companyId).isPresent();
    }

    /**
     * Kullanıcının Search Console'daki doğrulanmış sitelerini listeler.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, String>> listSites(UUID companyId) {
        String accessToken = oAuthService.getValidAccessToken(companyId).orElse(null);
        if (accessToken == null) return List.of();

        try {
            HttpHeaders headers = buildHeaders(accessToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    SC_SITES_LIST, HttpMethod.GET, entity, Map.class);

            if (response.getBody() == null) return List.of();

            List<Map<String, Object>> entries =
                    (List<Map<String, Object>>) response.getBody().get("siteEntry");
            if (entries == null) return List.of();

            List<Map<String, String>> sites = new ArrayList<>();
            for (Map<String, Object> entry : entries) {
                String url = (String) entry.get("siteUrl");
                String level = (String) entry.get("permissionLevel");
                if (url != null) {
                    sites.add(Map.of("siteUrl", url, "permissionLevel", level != null ? level : ""));
                }
            }
            return sites;
        } catch (Exception e) {
            log.error("SC site listesi alınamadı, companyId={}: {}", companyId, e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    public ScOverviewResponse getOverview(UUID companyId, String startDate, String endDate) {
        String rangeStart = (startDate != null && !startDate.isBlank()) ? startDate : DEFAULT_START;
        String rangeEnd = (endDate != null && !endDate.isBlank()) ? endDate : DEFAULT_END;

        if (!oAuthService.isConnected(companyId)) {
            return ScOverviewResponse.disabled();
        }

        String siteUrl = oAuthService.getSiteUrl(companyId).orElse(null);
        if (siteUrl == null || siteUrl.isBlank()) {
            return new ScOverviewResponse(
                    true, null, null, 0, 0, 0.0, 0.0,
                    List.of(), List.of(), List.of(), List.of(), List.of()
            );
        }

        String accessToken = oAuthService.getValidAccessToken(companyId).orElse(null);
        if (accessToken == null) {
            log.warn("SC access token alınamadı, companyId={}", companyId);
            return ScOverviewResponse.disabled();
        }

        // Tarih dönüşümü: "30daysAgo" → "2024-01-01" gibi
        String startDateResolved = resolveDate(rangeStart);
        String endDateResolved = resolveDate(rangeEnd);

        try {
            String encodedSiteUrl = java.net.URLEncoder.encode(siteUrl, "UTF-8");
            String apiUrl = SC_API_BASE + encodedSiteUrl + "/searchAnalytics/query";
            HttpHeaders headers = buildHeaders(accessToken);

            // 1. Genel metrikler (dimensionsız)
            Map<String, Object> overviewBody = new LinkedHashMap<>();
            overviewBody.put("startDate", startDateResolved);
            overviewBody.put("endDate", endDateResolved);
            overviewBody.put("rowLimit", 1);
            Map<String, Object> overviewResult = postQuery(apiUrl, headers, overviewBody);

            long totalClicks = 0;
            long totalImpressions = 0;
            double avgCtr = 0;
            double avgPosition = 0;

            List<Map<String, Object>> overviewRows = (List<Map<String, Object>>) overviewResult.get("rows");
            if (overviewRows != null && !overviewRows.isEmpty()) {
                Map<String, Object> row = overviewRows.get(0);
                totalClicks = toLong(row.get("clicks"));
                totalImpressions = toLong(row.get("impressions"));
                avgCtr = toDouble(row.get("ctr"));
                avgPosition = toDouble(row.get("position"));
            }

            // 2. Günlük trend
            Map<String, Object> dailyBody = new LinkedHashMap<>();
            dailyBody.put("startDate", startDateResolved);
            dailyBody.put("endDate", endDateResolved);
            dailyBody.put("dimensions", List.of("date"));
            dailyBody.put("rowLimit", 500);
            Map<String, Object> dailyResult = postQuery(apiUrl, headers, dailyBody);

            List<ScOverviewResponse.ScDailyRow> dailyTrend = new ArrayList<>();
            List<Map<String, Object>> dailyRows = (List<Map<String, Object>>) dailyResult.get("rows");
            if (dailyRows != null) {
                for (Map<String, Object> row : dailyRows) {
                    List<String> keys = (List<String>) row.get("keys");
                    String date = keys != null && !keys.isEmpty() ? formatDate(keys.get(0)) : "";
                    dailyTrend.add(new ScOverviewResponse.ScDailyRow(
                            date,
                            toLong(row.get("clicks")),
                            toLong(row.get("impressions")),
                            round4(toDouble(row.get("ctr"))),
                            round1(toDouble(row.get("position")))
                    ));
                }
                dailyTrend.sort(Comparator.comparing(ScOverviewResponse.ScDailyRow::date));
            }

            // 3. En çok aranan sorgular
            Map<String, Object> queryBody = new LinkedHashMap<>();
            queryBody.put("startDate", startDateResolved);
            queryBody.put("endDate", endDateResolved);
            queryBody.put("dimensions", List.of("query"));
            queryBody.put("rowLimit", 10);
            Map<String, Object> queryResult = postQuery(apiUrl, headers, queryBody);

            List<ScOverviewResponse.ScQueryRow> topQueries = new ArrayList<>();
            List<Map<String, Object>> queryRows = (List<Map<String, Object>>) queryResult.get("rows");
            if (queryRows != null) {
                for (Map<String, Object> row : queryRows) {
                    List<String> keys = (List<String>) row.get("keys");
                    topQueries.add(new ScOverviewResponse.ScQueryRow(
                            keys != null && !keys.isEmpty() ? keys.get(0) : "",
                            toLong(row.get("clicks")),
                            toLong(row.get("impressions")),
                            round4(toDouble(row.get("ctr"))),
                            round1(toDouble(row.get("position")))
                    ));
                }
            }

            // 4. En çok trafik alan sayfalar
            Map<String, Object> pageBody = new LinkedHashMap<>();
            pageBody.put("startDate", startDateResolved);
            pageBody.put("endDate", endDateResolved);
            pageBody.put("dimensions", List.of("page"));
            pageBody.put("rowLimit", 10);
            Map<String, Object> pageResult = postQuery(apiUrl, headers, pageBody);

            List<ScOverviewResponse.ScPageRow> topPages = new ArrayList<>();
            List<Map<String, Object>> pageRows = (List<Map<String, Object>>) pageResult.get("rows");
            if (pageRows != null) {
                for (Map<String, Object> row : pageRows) {
                    List<String> keys = (List<String>) row.get("keys");
                    topPages.add(new ScOverviewResponse.ScPageRow(
                            keys != null && !keys.isEmpty() ? keys.get(0) : "",
                            toLong(row.get("clicks")),
                            toLong(row.get("impressions")),
                            round4(toDouble(row.get("ctr"))),
                            round1(toDouble(row.get("position")))
                    ));
                }
            }

            // 5. Cihaz dağılımı
            Map<String, Object> deviceBody = new LinkedHashMap<>();
            deviceBody.put("startDate", startDateResolved);
            deviceBody.put("endDate", endDateResolved);
            deviceBody.put("dimensions", List.of("device"));
            deviceBody.put("rowLimit", 5);
            Map<String, Object> deviceResult = postQuery(apiUrl, headers, deviceBody);

            List<ScOverviewResponse.ScNamedMetric> devices = new ArrayList<>();
            List<Map<String, Object>> deviceRows = (List<Map<String, Object>>) deviceResult.get("rows");
            if (deviceRows != null) {
                for (Map<String, Object> row : deviceRows) {
                    List<String> keys = (List<String>) row.get("keys");
                    devices.add(new ScOverviewResponse.ScNamedMetric(
                            translateDevice(keys != null && !keys.isEmpty() ? keys.get(0) : ""),
                            toLong(row.get("clicks")),
                            toLong(row.get("impressions"))
                    ));
                }
            }

            // 6. Ülkelere göre
            Map<String, Object> countryBody = new LinkedHashMap<>();
            countryBody.put("startDate", startDateResolved);
            countryBody.put("endDate", endDateResolved);
            countryBody.put("dimensions", List.of("country"));
            countryBody.put("rowLimit", 8);
            Map<String, Object> countryResult = postQuery(apiUrl, headers, countryBody);

            List<ScOverviewResponse.ScNamedMetric> countries = new ArrayList<>();
            List<Map<String, Object>> countryRows = (List<Map<String, Object>>) countryResult.get("rows");
            if (countryRows != null) {
                for (Map<String, Object> row : countryRows) {
                    List<String> keys = (List<String>) row.get("keys");
                    countries.add(new ScOverviewResponse.ScNamedMetric(
                            keys != null && !keys.isEmpty() ? keys.get(0) : "",
                            toLong(row.get("clicks")),
                            toLong(row.get("impressions"))
                    ));
                }
            }

            return new ScOverviewResponse(
                    true, siteUrl, null,
                    totalClicks, totalImpressions,
                    Math.round(avgCtr * 10000.0) / 100.0,
                    Math.round(avgPosition * 10.0) / 10.0,
                    dailyTrend, topQueries, topPages, devices, countries
            );

        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            String userMsg;
            if (msg.contains("403") || msg.contains("Forbidden")) {
                userMsg = "Bu Google hesabının Search Console'a erişim yetkisi yok. Lütfen site sahipliğini kontrol edin.";
            } else if (msg.contains("401") || msg.contains("Unauthorized")) {
                userMsg = "Oturum süresi dolmuş. Lütfen Google hesabınızı yeniden bağlayın.";
            } else if (msg.contains("404") || msg.contains("not found")) {
                userMsg = "Site URL'i Search Console'da bulunamadı. Lütfen doğru URL'i girin.";
            } else {
                userMsg = "Search Console API hatası: " + msg.split("\n")[0];
            }
            log.error("SC API hatası, companyId={}: {}", companyId, msg);
            return ScOverviewResponse.error(siteUrl, userMsg);
        }
    }

    // ─── Yardımcı ───────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> postQuery(String apiUrl, HttpHeaders headers, Map<String, Object> body) {
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        java.net.URI uri = java.net.URI.create(apiUrl);
        ResponseEntity<Map> response = restTemplate.exchange(uri, HttpMethod.POST, entity, Map.class);
        return response.getBody() != null ? response.getBody() : Map.of();
    }

    private HttpHeaders buildHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);
        return headers;
    }

    /**
     * "30daysAgo" gibi relative tarihleri "2024-01-01" formatına çevirir.
     * Eğer zaten YYYY-MM-DD formatındaysa aynen döner.
     */
    private String resolveDate(String input) {
        if (input == null || input.isBlank()) return LocalDate.now().minusDays(30).format(DATE_FMT);

        if ("today".equalsIgnoreCase(input)) {
            return LocalDate.now().format(DATE_FMT);
        }

        if (input.endsWith("daysAgo")) {
            try {
                int days = Integer.parseInt(input.replace("daysAgo", ""));
                return LocalDate.now().minusDays(days).format(DATE_FMT);
            } catch (NumberFormatException e) {
                return LocalDate.now().minusDays(30).format(DATE_FMT);
            }
        }

        // Zaten YYYY-MM-DD formatında
        return input;
    }

    /** YYYY-MM-DD → DD.MM formatına çevirir */
    private String formatDate(String yyyymmdd) {
        if (yyyymmdd == null || yyyymmdd.length() < 10) return yyyymmdd;
        return yyyymmdd.substring(8) + "." + yyyymmdd.substring(5, 7);
    }

    private String translateDevice(String device) {
        return switch (device.toUpperCase()) {
            case "DESKTOP" -> "Masaüstü";
            case "MOBILE" -> "Mobil";
            case "TABLET" -> "Tablet";
            default -> device;
        };
    }

    private long toLong(Object val) {
        if (val == null) return 0;
        if (val instanceof Number n) return n.longValue();
        try { return Long.parseLong(val.toString()); }
        catch (NumberFormatException e) { return 0; }
    }

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(val.toString()); }
        catch (NumberFormatException e) { return 0.0; }
    }

    private double round4(double val) { return Math.round(val * 10000.0) / 10000.0; }
    private double round1(double val) { return Math.round(val * 10.0) / 10.0; }
}
