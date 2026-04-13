import api from './client';

export interface GaDailyRow {
    date: string;
    sessions: number;
    users: number;
}

export interface GaNamedMetric {
    name: string;
    value: number;
}

export interface GaOverviewResponse {
    connected: boolean;
    propertyId: string | null;
    errorMessage: string | null;
    sessions: number;
    totalUsers: number;
    newUsers: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
    dailyTrend: GaDailyRow[];
    trafficSources: GaNamedMetric[];
    topPages: GaNamedMetric[];
    topCountries: GaNamedMetric[];
}

export interface GaStatusResponse {
    connected: boolean;
    propertyId: string;
    authUrl: string;
}

export const gaApi = {
    getStatus: (companyId: string) =>
        api.get<GaStatusResponse>('/client/analytics/ga/status', {
            params: { companyId }
        }).then(r => r.data),

    getOverview: (companyId: string, startDate?: string, endDate?: string) =>
        api.get<GaOverviewResponse>('/client/analytics/ga/overview', {
            params: { companyId, startDate, endDate }
        }).then(r => r.data),

    saveProperty: (companyId: string, propertyId: string) =>
        api.post('/client/analytics/ga/property', { propertyId }, {
            params: { companyId }
        }).then(r => r.data),

    disconnect: (companyId: string) =>
        api.delete('/client/analytics/ga/disconnect', {
            params: { companyId }
        }).then(r => r.data),
};

