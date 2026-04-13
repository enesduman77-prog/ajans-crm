import api from './client';

export interface ScDailyRow {
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface ScQueryRow {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface ScPageRow {
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface ScNamedMetric {
    name: string;
    clicks: number;
    impressions: number;
}

export interface ScOverviewResponse {
    connected: boolean;
    siteUrl: string | null;
    errorMessage: string | null;
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
    dailyTrend: ScDailyRow[];
    topQueries: ScQueryRow[];
    topPages: ScPageRow[];
    devices: ScNamedMetric[];
    countries: ScNamedMetric[];
}

export interface ScStatusResponse {
    connected: boolean;
    siteUrl: string;
    hasScScope: boolean;
    needsReconnect: boolean;
    authUrl: string;
}

export interface ScSite {
    siteUrl: string;
    permissionLevel: string;
}

export const scApi = {
    getStatus: (companyId: string) =>
        api.get<ScStatusResponse>('/client/analytics/sc/status', {
            params: { companyId }
        }).then(r => r.data),

    listSites: (companyId: string) =>
        api.get<ScSite[]>('/client/analytics/sc/sites', {
            params: { companyId }
        }).then(r => r.data),

    getOverview: (companyId: string, startDate?: string, endDate?: string) =>
        api.get<ScOverviewResponse>('/client/analytics/sc/overview', {
            params: { companyId, startDate, endDate }
        }).then(r => r.data),

    saveSiteUrl: (companyId: string, siteUrl: string) =>
        api.post('/client/analytics/sc/site-url', { siteUrl }, {
            params: { companyId }
        }).then(r => r.data),
};
