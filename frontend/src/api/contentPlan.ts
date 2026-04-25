import api from './client';
import type { PageResponse } from './staff';

export interface ContentPlanResponse {
    id: string;
    companyId: string;
    companyName: string;
    createdById: string;
    createdByName: string;
    title: string;
    description: string | null;
    authorName: string;
    platform: string;
    contentSize: string | null;
    direction: string | null;
    speakerModel: string | null;
    status: string;
    revisionNote: string | null;
    plannedDate: string | null;
    shootId: string | null;
    shootDate: string | null;
    shootTitle: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateContentPlanRequest {
    companyId: string;
    title: string;
    description?: string;
    authorName: string;
    platform: string;
    contentSize?: string;
    direction?: string;
    speakerModel?: string;
    plannedDate?: string;
}

export interface UpdateContentPlanRequest {
    title?: string;
    description?: string;
    authorName?: string;
    platform?: string;
    contentSize?: string;
    direction?: string;
    speakerModel?: string;
    status?: string;
    revisionNote?: string;
    plannedDate?: string;
}

export interface ApproveContentPlanRequest {
    companyId: string;
    shootTitle: string;
    shootDescription?: string;
    shootDate?: string;
    shootTime?: string;
    location?: string;
}

// Staff endpoints (full CRUD)
export const contentPlanApi = {
    create: (data: CreateContentPlanRequest) =>
        api.post<ContentPlanResponse>('/staff/content-plans', data).then(r => r.data),

    update: (id: string, data: UpdateContentPlanRequest) =>
        api.put<ContentPlanResponse>(`/staff/content-plans/${id}`, data).then(r => r.data),

    getAll: (page = 0, size = 20) =>
        api.get<PageResponse<ContentPlanResponse>>(`/staff/content-plans?page=${page}&size=${size}`).then(r => r.data),

    getByCompany: (companyId: string, status?: string, page = 0, size = 20) =>
        api.get<PageResponse<ContentPlanResponse>>(`/staff/content-plans/company/${companyId}`, {
            params: { status, page, size }
        }).then(r => r.data),

    getById: (id: string) =>
        api.get<ContentPlanResponse>(`/staff/content-plans/${id}`).then(r => r.data),

    delete: (id: string) =>
        api.delete(`/staff/content-plans/${id}`).then(r => r.data),

    getByShoot: (shootId: string) =>
        api.get<ContentPlanResponse[]>(`/staff/content-plans/shoot/${shootId}`).then(r => r.data),
};

// Client endpoints
export const clientContentPlanApi = {
    getByCompany: (companyId: string, status?: string, page = 0, size = 20) =>
        api.get<PageResponse<ContentPlanResponse>>(`/client/content-plans`, {
            params: { companyId, status, page, size }
        }).then(r => r.data),

    getById: (id: string) =>
        api.get<ContentPlanResponse>(`/client/content-plans/${id}`).then(r => r.data),

    approveWithShoot: (id: string, data: ApproveContentPlanRequest) =>
        api.post<ContentPlanResponse>(`/client/content-plans/${id}/approve`, data).then(r => r.data),

    approveWithExistingShoot: (id: string, companyId: string, shootId: string) =>
        api.post<ContentPlanResponse>(`/client/content-plans/${id}/approve-existing?companyId=${companyId}&shootId=${shootId}`).then(r => r.data),
};
