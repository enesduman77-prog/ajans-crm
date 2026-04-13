package com.fogistanbul.crm.service;

import com.fogistanbul.crm.dto.GaOverviewResponse;
import com.google.analytics.data.v1beta.BetaAnalyticsDataClient;
import com.google.analytics.data.v1beta.BetaAnalyticsDataSettings;
import com.google.analytics.data.v1beta.DateRange;
import com.google.analytics.data.v1beta.Dimension;
import com.google.analytics.data.v1beta.Metric;
import com.google.analytics.data.v1beta.OrderBy;
import com.google.analytics.data.v1beta.Row;
import com.google.analytics.data.v1beta.RunReportRequest;
import com.google.analytics.data.v1beta.RunReportResponse;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.OAuth2Credentials;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAnalyticsService.class);
    private static final String DEFAULT_START = "30daysAgo";
    private static final String DEFAULT_END   = "today";

    private final GoogleOAuthService oAuthService;

    /**
     * Belirtilen ÅŸirketin GA baÄŸlantÄ±sÄ± var ve propertyId set edilmiÅŸse true.
     */
    public boolean isConfigured(UUID companyId) {
        return oAuthService.isConnected(companyId)
                && oAuthService.getPropertyId(companyId).isPresent();
    }

    public GaOverviewResponse getOverview(UUID companyId, String startDate, String endDate) {
        String rangeStart = (startDate != null && !startDate.isBlank()) ? startDate : DEFAULT_START;
        String rangeEnd   = (endDate != null && !endDate.isBlank()) ? endDate : DEFAULT_END;
        if (!oAuthService.isConnected(companyId)) {
            return GaOverviewResponse.disabled();
        }

        String propertyId = oAuthService.getPropertyId(companyId).orElse(null);
        if (propertyId == null || propertyId.isBlank()) {
            // Bağlı ama property seçilmemiş
            return new GaOverviewResponse(
                    true, null, null, 0, 0, 0, 0, 0.0, 0.0,
                    List.of(), List.of(), List.of(), List.of()
            );
        }

        String accessToken = oAuthService.getValidAccessToken(companyId).orElse(null);
        if (accessToken == null) {
            log.warn("GA access token alÄ±namadÄ±, companyId={}", companyId);
            return GaOverviewResponse.disabled();
        }

        try (BetaAnalyticsDataClient client = buildClient(accessToken)) {
            String property = "properties/" + propertyId;
            DateRange dr = dateRange(rangeStart, rangeEnd);

            // 1. Temel metrikler
            RunReportResponse overview = client.runReport(RunReportRequest.newBuilder()
                    .setProperty(property)
                    .addDateRanges(dr)
                    .addMetrics(metric("sessions"))
                    .addMetrics(metric("totalUsers"))
                    .addMetrics(metric("newUsers"))
                    .addMetrics(metric("screenPageViews"))
                    .addMetrics(metric("bounceRate"))
                    .addMetrics(metric("averageSessionDuration"))
                    .build());

            long sessions = 0, totalUsers = 0, newUsers = 0, pageViews = 0;
            double bounceRate = 0, avgDuration = 0;

            if (overview.getRowsCount() > 0) {
                Row row = overview.getRows(0);
                sessions    = parseLong(row, 0);
                totalUsers  = parseLong(row, 1);
                newUsers    = parseLong(row, 2);
                pageViews   = parseLong(row, 3);
                bounceRate  = parseDouble(row, 4);
                avgDuration = parseDouble(row, 5);
            }

            // 2. GÃ¼nlÃ¼k trend
            RunReportResponse dailyReport = client.runReport(RunReportRequest.newBuilder()
                    .setProperty(property)
                    .addDateRanges(dr)
                    .addDimensions(dimension("date"))
                    .addMetrics(metric("sessions"))
                    .addMetrics(metric("totalUsers"))
                    .addOrderBys(OrderBy.newBuilder()
                            .setDimension(OrderBy.DimensionOrderBy.newBuilder().setDimensionName("date"))
                            .setDesc(false))
                    .build());

            List<GaOverviewResponse.GaDailyRow> dailyTrend = new ArrayList<>();
            for (Row row : dailyReport.getRowsList()) {
                dailyTrend.add(new GaOverviewResponse.GaDailyRow(
                        formatDate(row.getDimensionValues(0).getValue()),
                        parseLong(row, 0),
                        parseLong(row, 1)
                ));
            }

            // 3. Trafik kaynaklarÄ±
            RunReportResponse sourcesReport = client.runReport(RunReportRequest.newBuilder()
                    .setProperty(property)
                    .addDateRanges(dr)
                    .addDimensions(dimension("sessionDefaultChannelGroup"))
                    .addMetrics(metric("sessions"))
                    .addOrderBys(orderByMetricDesc("sessions"))
                    .setLimit(6)
                    .build());

            List<GaOverviewResponse.GaNamedMetric> trafficSources = new ArrayList<>();
            for (Row row : sourcesReport.getRowsList()) {
                trafficSources.add(new GaOverviewResponse.GaNamedMetric(
                        row.getDimensionValues(0).getValue(), parseLong(row, 0)));
            }

            // 4. En Ã§ok ziyaret edilen sayfalar
            RunReportResponse pagesReport = client.runReport(RunReportRequest.newBuilder()
                    .setProperty(property)
                    .addDateRanges(dr)
                    .addDimensions(dimension("pagePath"))
                    .addMetrics(metric("screenPageViews"))
                    .addOrderBys(orderByMetricDesc("screenPageViews"))
                    .setLimit(8)
                    .build());

            List<GaOverviewResponse.GaNamedMetric> topPages = new ArrayList<>();
            for (Row row : pagesReport.getRowsList()) {
                topPages.add(new GaOverviewResponse.GaNamedMetric(
                        row.getDimensionValues(0).getValue(), parseLong(row, 0)));
            }

            // 5. Ãœlkelere gÃ¶re
            RunReportResponse countriesReport = client.runReport(RunReportRequest.newBuilder()
                    .setProperty(property)
                    .addDateRanges(dr)
                    .addDimensions(dimension("country"))
                    .addMetrics(metric("sessions"))
                    .addOrderBys(orderByMetricDesc("sessions"))
                    .setLimit(5)
                    .build());

            List<GaOverviewResponse.GaNamedMetric> topCountries = new ArrayList<>();
            for (Row row : countriesReport.getRowsList()) {
                topCountries.add(new GaOverviewResponse.GaNamedMetric(
                        row.getDimensionValues(0).getValue(), parseLong(row, 0)));
            }

            return new GaOverviewResponse(
                    true, propertyId, null,
                    sessions, totalUsers, newUsers, pageViews,
                    Math.round(bounceRate * 10000.0) / 100.0,
                    Math.round(avgDuration * 10.0) / 10.0,
                    dailyTrend, trafficSources, topPages, topCountries
            );

        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            String userMsg;
            if (msg.contains("PERMISSION_DENIED") || msg.contains("not found") || msg.contains("INVALID_ARGUMENT")) {
                userMsg = "Mülk ID geçersiz veya bu hesabın erişim yetkisi yok. Lütfen doğru Property ID'yi girin.";
            } else if (msg.contains("UNAUTHENTICATED")) {
                userMsg = "Oturum süresi dolmuş. Lütfen Google hesabınızı yeniden bağlayın.";
            } else {
                userMsg = "GA API hatası: " + msg.split("\n")[0];
            }
            log.error("GA API hatası, companyId={}: {}", companyId, msg);
            return GaOverviewResponse.error(propertyId, userMsg);
        }
    }

    // â”€â”€â”€ YardÄ±mcÄ± â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private BetaAnalyticsDataClient buildClient(String accessToken) throws Exception {
        AccessToken googleAccessToken = new AccessToken(accessToken,
                Date.from(java.time.Instant.now().plusSeconds(3600)));
        OAuth2Credentials credentials = OAuth2Credentials.create(googleAccessToken);

        BetaAnalyticsDataSettings settings = BetaAnalyticsDataSettings.newBuilder()
                .setCredentialsProvider(() -> credentials)
                .build();

        return BetaAnalyticsDataClient.create(settings);
    }

    private DateRange dateRange(String start, String end) {
        return DateRange.newBuilder().setStartDate(start).setEndDate(end).build();
    }

    private Metric metric(String name) {
        return Metric.newBuilder().setName(name).build();
    }

    private Dimension dimension(String name) {
        return Dimension.newBuilder().setName(name).build();
    }

    private OrderBy orderByMetricDesc(String metricName) {
        return OrderBy.newBuilder()
                .setMetric(OrderBy.MetricOrderBy.newBuilder().setMetricName(metricName))
                .setDesc(true)
                .build();
    }

    private long parseLong(Row row, int idx) {
        try { return Long.parseLong(row.getMetricValues(idx).getValue()); }
        catch (NumberFormatException e) { return 0L; }
    }

    private double parseDouble(Row row, int idx) {
        try { return Double.parseDouble(row.getMetricValues(idx).getValue()); }
        catch (NumberFormatException e) { return 0.0; }
    }

    /** YYYYMMDD â†’ DD.MM */
    private String formatDate(String yyyymmdd) {
        if (yyyymmdd.length() != 8) return yyyymmdd;
        return yyyymmdd.substring(6) + "." + yyyymmdd.substring(4, 6);
    }
}


