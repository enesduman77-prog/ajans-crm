package com.fogistanbul.crm.dto;

import java.util.List;

public record IgOverviewResponse(
        boolean connected,
        String username,
        String errorMessage,
        // Profil
        long followersCount,
        long followsCount,
        long mediaCount,
        // Dönem metrikleri
        long impressions,
        long reach,
        long profileViews,
        long websiteClicks,
        long totalLikes,
        long totalComments,
        // Takipçi değişimi
        long followersGained,
        long followersLost,
        // Günlük trend
        List<IgDailyRow> dailyTrend,
        // Son paylaşımlar
        List<IgMediaRow> recentMedia
) {
    public static IgOverviewResponse disabled() {
        return new IgOverviewResponse(false, null, null,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                List.of(), List.of());
    }

    public record IgDailyRow(String date, long followers, long impressions, long reach) {}

    public record IgMediaRow(String id, String caption, String mediaType,
                             String mediaUrl, String permalink, String timestamp,
                             long likeCount, long commentsCount) {}

    public record IgReelRow(String id, String caption, String thumbnailUrl,
                            String permalink, String timestamp,
                            long likeCount, long commentsCount,
                            long plays, long reach, long saved, long shares) {}
}
