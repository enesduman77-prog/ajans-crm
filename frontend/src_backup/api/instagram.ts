import api from './client';

export interface IgDailyRow {
    date: string;
    followers: number;
    impressions: number;
    reach: number;
}

export interface IgMediaRow {
    id: string;
    caption: string;
    mediaType: string;
    mediaUrl: string;
    permalink: string;
    timestamp: string;
    likeCount: number;
    commentsCount: number;
}

export interface IgOverviewResponse {
    connected: boolean;
    username: string | null;
    errorMessage: string | null;
    followersCount: number;
    followsCount: number;
    mediaCount: number;
    impressions: number;
    reach: number;
    profileViews: number;
    websiteClicks: number;
    totalLikes: number;
    totalComments: number;
    followersGained: number;
    followersLost: number;
    dailyTrend: IgDailyRow[];
    recentMedia: IgMediaRow[];
}

export interface IgStatusResponse {
    configured: boolean;
    connected: boolean;
    authUrl: string;
    username: string;
    igUserId: string;
}

export const igApi = {
    getStatus: (companyId: string) =>
        api.get<IgStatusResponse>('/client/analytics/ig/status', {
            params: { companyId }
        }).then(r => r.data),

    getOverview: (companyId: string, startDate?: string, endDate?: string) =>
        api.get<IgOverviewResponse>('/client/analytics/ig/overview', {
            params: { companyId, startDate, endDate }
        }).then(r => r.data),

    disconnect: (companyId: string) =>
        api.delete('/client/analytics/ig/disconnect', {
            params: { companyId }
        }).then(r => r.data),
};
