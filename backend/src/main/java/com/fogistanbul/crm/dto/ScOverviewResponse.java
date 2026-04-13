package com.fogistanbul.crm.dto;

import java.util.List;

public record ScOverviewResponse(
        boolean connected,
        String siteUrl,
        String errorMessage,

        // Temel metrikler
        long totalClicks,
        long totalImpressions,
        double avgCtr,
        double avgPosition,

        // Günlük trend
        List<ScDailyRow> dailyTrend,

        // En çok aranan sorgular
        List<ScQueryRow> topQueries,

        // En çok trafik alan sayfalar
        List<ScPageRow> topPages,

        // Cihaz dağılımı
        List<ScNamedMetric> devices,

        // Ülkelere göre
        List<ScNamedMetric> countries
) {
    public static ScOverviewResponse disabled() {
        return new ScOverviewResponse(
                false, "", null, 0, 0, 0.0, 0.0,
                List.of(), List.of(), List.of(), List.of(), List.of()
        );
    }

    public static ScOverviewResponse error(String siteUrl, String message) {
        return new ScOverviewResponse(
                true, siteUrl, message, 0, 0, 0.0, 0.0,
                List.of(), List.of(), List.of(), List.of(), List.of()
        );
    }

    public record ScDailyRow(String date, long clicks, long impressions, double ctr, double position) {}
    public record ScQueryRow(String query, long clicks, long impressions, double ctr, double position) {}
    public record ScPageRow(String page, long clicks, long impressions, double ctr, double position) {}
    public record ScNamedMetric(String name, long clicks, long impressions) {}
}
