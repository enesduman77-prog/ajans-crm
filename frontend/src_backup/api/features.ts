import api from './client';

// --- Types ---
export interface NotificationResponse {
    id: string;
    title: string;
    message: string | null;
    type: string;
    referenceType: string | null;
    referenceId: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface FileAttachmentResponse {
    id: string;
    originalName: string;
    contentType: string | null;
    fileSize: number;
    uploadedById: string;
    uploadedByName: string;
    entityType: string;
    entityId: string;
    createdAt: string;
}

export interface ActivityLogResponse {
    id: string;
    userId: string | null;
    userName: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    entityName: string | null;
    details: Record<string, unknown> | null;
    createdAt: string;
}

export interface TimeEntryResponse {
    id: string;
    userId: string;
    userName: string;
    taskId: string | null;
    taskTitle: string | null;
    companyId: string | null;
    companyName: string | null;
    description: string | null;
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number | null;
    isRunning: boolean;
    createdAt: string;
}

export interface SearchResponse {
    companies: SearchResult[];
    tasks: SearchResult[];
    staff: SearchResult[];
    notes: SearchResult[];
}

export interface SearchResult {
    id: string;
    title: string;
    subtitle: string | null;
    type: string;
    route: string;
}

export interface NotificationPreferenceResponse {
    notificationType: string;
    inApp: boolean;
    email: boolean;
}

export interface PageResponse<T> {
    content: T[];
    page: {
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
    };
    // backward compat — bazı endpointler hâlâ düz alan döndürebilir
    totalElements?: number;
    totalPages?: number;
    number?: number;
    size?: number;
}

// --- API ---
export const notificationApi = {
    getAll: (page = 0, size = 20) =>
        api.get<PageResponse<NotificationResponse>>(`/notifications?page=${page}&size=${size}`).then(r => r.data),
    getUnreadCount: () =>
        api.get<{ count: number }>('/notifications/unread-count').then(r => r.data.count),
    markAsRead: (id: string) =>
        api.put(`/notifications/${id}/read`),
    markAllAsRead: () =>
        api.put('/notifications/read-all'),
};

export const fileApi = {
    upload: (file: File, entityType: string, entityId: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        return api.post<FileAttachmentResponse>('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
    },
    getByEntity: (entityType: string, entityId: string) =>
        api.get<FileAttachmentResponse[]>(`/files/entity/${entityType}/${entityId}`).then(r => r.data),
    getDownloadUrl: (fileId: string) => `/api/files/download/${fileId}`,
    delete: (fileId: string) =>
        api.delete(`/files/${fileId}`),
    getCompanyMedia: (companyId: string, page = 0, size = 24, filter?: string) =>
        api.get<PageResponse<FileAttachmentResponse>>(`/files/media/company/${companyId}?page=${page}&size=${size}${filter ? `&filter=${filter}` : ''}`).then(r => r.data),
    getCompanyMediaCounts: () =>
        api.get<Record<string, number>>('/files/media/company-counts').then(r => r.data),
};

export const activityLogApi = {
    getAll: (page = 0, size = 30) =>
        api.get<PageResponse<ActivityLogResponse>>(`/admin/activity-logs?page=${page}&size=${size}`).then(r => r.data),
    getByEntityType: (entityType: string, page = 0, size = 30) =>
        api.get<PageResponse<ActivityLogResponse>>(`/admin/activity-logs/entity/${entityType}?page=${page}&size=${size}`).then(r => r.data),
};

export const timeTrackingApi = {
    start: (taskId: string, description?: string) =>
        api.post<TimeEntryResponse>('/staff/time-tracking/start', { taskId, description }).then(r => r.data),
    stop: () =>
        api.post<TimeEntryResponse>('/staff/time-tracking/stop').then(r => r.data),
    getRunning: () =>
        api.get<TimeEntryResponse>('/staff/time-tracking/running').then(r => r.data).catch(() => null),
    getMyEntries: (page = 0, size = 20) =>
        api.get<PageResponse<TimeEntryResponse>>(`/staff/time-tracking/my?page=${page}&size=${size}`).then(r => r.data),
    delete: (id: string) =>
        api.delete(`/staff/time-tracking/${id}`),
};

export const searchApi = {
    search: (q: string) =>
        api.get<SearchResponse>(`/search?q=${encodeURIComponent(q)}`).then(r => r.data),
};

export const calendarApi = {
    getExportUrl: () => '/api/calendar/export.ics',
};

export const notificationPreferenceApi = {
    getAll: () =>
        api.get<NotificationPreferenceResponse[]>('/notification-preferences').then(r => r.data),
    update: (data: { notificationType: string; inApp: boolean; email: boolean }) =>
        api.put<NotificationPreferenceResponse>('/notification-preferences', data).then(r => r.data),
};
