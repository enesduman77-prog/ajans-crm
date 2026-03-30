package com.fogistanbul.crm.dto;

import java.util.List;

public record GaOverviewResponse(
        boolean connected,
        String propertyId,
        String errorMessage,

        // Temel metrikler (son 30 gün)
        long sessions,
        long totalUsers,
        long newUsers,
        long pageViews,
        double bounceRate,
        double avgSessionDuration,

        // Günlük trend (son 30 gün)
        List<GaDailyRow> dailyTrend,

        // Trafik kaynakları
        List<GaNamedMetric> trafficSources,

        // En çok ziyaret edilen sayfalar
        List<GaNamedMetric> topPages,

        // Ülkelere göre
        List<GaNamedMetric> topCountries
) {
    public static GaOverviewResponse disabled() {
        return new GaOverviewResponse(
                false, "", null, 0, 0, 0, 0, 0.0, 0.0,
                List.of(), List.of(), List.of(), List.of()
        );
    }

    public static GaOverviewResponse error(String propertyId, String message) {
        return new GaOverviewResponse(
                true, propertyId, message, 0, 0, 0, 0, 0.0, 0.0,
                List.of(), List.of(), List.of(), List.of()
        );
    }

    public record GaDailyRow(String date, long sessions, long users) {}
    public record GaNamedMetric(String name, long value) {}
}
