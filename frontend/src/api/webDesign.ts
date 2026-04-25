import api from './client';

export interface PageSpeedScore {
    strategy: 'mobile' | 'desktop';
    testedUrl?: string;
    performance?: number | null;
    accessibility?: number | null;
    bestPractices?: number | null;
    seo?: number | null;
    lcpMs?: number | null;
    fidMs?: number | null;
    clsValue?: number | null;
    tbtMs?: number | null;
    fcpMs?: number | null;
    fetchedAt?: string;
    fetchError?: string | null;
}

export interface PageSpeedReport {
    websiteUrl?: string;
    configured: boolean;
    mobile?: PageSpeedScore;
    desktop?: PageSpeedScore;
    hostingProvider?: string | null;
    domainExpiry?: string | null;
    sslExpiry?: string | null;
    cmsType?: string | null;
    cmsVersion?: string | null;
    themeName?: string | null;
}

export interface MaintenanceLogEntry {
    id: string;
    companyId: string;
    title: string;
    description?: string | null;
    category: string;
    performedAt: string;
    performedById?: string | null;
    performedByName?: string | null;
    createdAt: string;
    updatedAt?: string;
}

export interface MaintenanceLogRequest {
    title: string;
    description?: string;
    category: string;
    performedAt: string;
}

export const webDesignApi = {
    // Client (own company)
    getMyPageSpeed: (refresh = false) =>
        api.get<PageSpeedReport>('/client/pagespeed', { params: { refresh } }).then(r => r.data),
    getMyMaintenanceLog: () =>
        api.get<MaintenanceLogEntry[]>('/client/maintenance-log').then(r => r.data),

    // Staff/admin (any company)
    getCompanyPageSpeed: (companyId: string, refresh = false) =>
        api.get<PageSpeedReport>(`/staff/companies/${companyId}/pagespeed`, { params: { refresh } }).then(r => r.data),
    getCompanyMaintenanceLog: (companyId: string) =>
        api.get<MaintenanceLogEntry[]>(`/staff/companies/${companyId}/maintenance-log`).then(r => r.data),
    createMaintenanceLog: (companyId: string, data: MaintenanceLogRequest) =>
        api.post<MaintenanceLogEntry>(`/staff/companies/${companyId}/maintenance-log`, data).then(r => r.data),
    updateMaintenanceLog: (companyId: string, id: string, data: MaintenanceLogRequest) =>
        api.put<MaintenanceLogEntry>(`/staff/companies/${companyId}/maintenance-log/${id}`, data).then(r => r.data),
    deleteMaintenanceLog: (companyId: string, id: string) =>
        api.delete(`/staff/companies/${companyId}/maintenance-log/${id}`).then(r => r.data),
};
