import api from './client';
import type { CompanyResponse } from './admin';

// --- Types ---
export interface TaskResponse {
    id: string;
    companyId: string;
    companyName: string;
    assignedToId: string | null;
    assignedToName: string | null;
    createdById: string;
    createdByName: string;
    title: string;
    description: string | null;
    category: string;
    priority: string;
    status: string;
    dueDate: string | null;
    dueTime: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskRequest {
    companyId: string;
    assignedToId?: string;
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    dueDate?: string;
    dueTime?: string;
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: string;
    category?: string;
    priority?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface TaskReviewResponse {
    id: string;
    taskId: string;
    taskTitle: string;
    reviewerId: string;
    reviewerName: string;
    score: number;
    comment: string | null;
    createdAt: string;
}

export interface MeetingResponse {
    id: string;
    companyId: string;
    companyName: string;
    title: string;
    description: string | null;
    meetingDate: string;
    durationMinutes: number | null;
    location: string | null;
    status: string;
    createdById: string;
    createdByName: string;
    participants: { userId: string; fullName: string; email: string }[];
    createdAt: string;
}

export interface ShootResponse {
    id: string;
    companyId: string;
    companyName: string;
    title: string;
    description: string | null;
    shootDate: string | null;
    shootTime: string | null;
    location: string | null;
    status: string;
    createdById: string;
    createdByName: string;
    participants: { userId: string; fullName: string; roleInShoot: string | null }[];
    createdAt: string;
}

export interface PrProjectResponse {
    id: string;
    companyId: string;
    companyName: string;
    name: string;
    purpose: string | null;
    totalPhases: number;
    currentPhase: number;
    progressPercent: number;
    status: string;
    createdById: string;
    createdByName: string;
    phases: { id: string; phaseNumber: number; name: string; isCompleted: boolean; completedAt: string | null }[];
    members: { userId: string; fullName: string }[];
    createdAt: string;
}

export interface NoteResponse {
    id: string;
    userId: string;
    userName: string;
    companyId: string | null;
    companyName: string | null;
    content: string;
    isOpen: boolean;
    noteDate: string;
    createdAt: string;
}

// --- API ---
export const staffApi = {
    // Tasks
    getMyTasks: (page = 0, size = 20) =>
        api.get<PageResponse<TaskResponse>>(`/staff/tasks/my?page=${page}&size=${size}`).then(r => r.data),

    getAllTasks: (page = 0, size = 20, status?: string) =>
        api.get<PageResponse<TaskResponse>>(`/staff/tasks?page=${page}&size=${size}${status ? `&status=${status}` : ''}`).then(r => r.data),

    getTasksByCompany: (companyId: string, page = 0, size = 20) =>
        api.get<PageResponse<TaskResponse>>(`/staff/tasks/company/${companyId}?page=${page}&size=${size}`).then(r => r.data),

    getTask: (id: string) =>
        api.get<TaskResponse>(`/staff/tasks/${id}`).then(r => r.data),

    createTask: (data: CreateTaskRequest) =>
        api.post<TaskResponse>('/staff/tasks', data).then(r => r.data),

    updateTask: (id: string, data: UpdateTaskRequest) =>
        api.put<TaskResponse>(`/staff/tasks/${id}`, data).then(r => r.data),

    deleteTask: (id: string) =>
        api.delete(`/staff/tasks/${id}`).then(r => r.data),

    // Companies (staff-accessible)
    getCompanies: () =>
        api.get<CompanyResponse[]>('/staff/companies').then(r => r.data),

    getCompany: (id: string) =>
        api.get<CompanyResponse>(`/staff/companies/${id}`).then(r => r.data),

    // Meetings
    getMeetings: (page = 0, size = 20) =>
        api.get<PageResponse<MeetingResponse>>(`/staff/meetings?page=${page}&size=${size}`).then(r => r.data),

    getMeetingsByCompany: (companyId: string, page = 0, size = 20) =>
        api.get<PageResponse<MeetingResponse>>(`/staff/meetings/company/${companyId}?page=${page}&size=${size}`).then(r => r.data),

    createMeeting: (data: { companyId: string; title: string; description?: string; meetingDate: string; durationMinutes?: number; location?: string; participantIds?: string[] }) =>
        api.post<MeetingResponse>('/staff/meetings', data).then(r => r.data),

    updateMeetingStatus: (id: string, status: string) =>
        api.put<MeetingResponse>(`/staff/meetings/${id}/status?status=${status}`).then(r => r.data),

    deleteMeeting: (id: string) =>
        api.delete(`/staff/meetings/${id}`).then(r => r.data),

    // Shoots
    getShoots: (page = 0, size = 20) =>
        api.get<PageResponse<ShootResponse>>(`/staff/shoots?page=${page}&size=${size}`).then(r => r.data),

    getShootsByCompany: (companyId: string, page = 0, size = 20) =>
        api.get<PageResponse<ShootResponse>>(`/staff/shoots/company/${companyId}?page=${page}&size=${size}`).then(r => r.data),

    createShoot: (data: { companyId: string; title: string; description?: string; shootDate?: string; shootTime?: string; location?: string; participants?: { userId: string; roleInShoot: string }[] }) =>
        api.post<ShootResponse>('/staff/shoots', data).then(r => r.data),

    updateShootStatus: (id: string, status: string) =>
        api.put<ShootResponse>(`/staff/shoots/${id}/status?status=${status}`).then(r => r.data),

    deleteShoot: (id: string) =>
        api.delete(`/staff/shoots/${id}`).then(r => r.data),

    // PR Projects
    getPrProjects: (page = 0, size = 20) =>
        api.get<PageResponse<PrProjectResponse>>(`/staff/pr-projects?page=${page}&size=${size}`).then(r => r.data),

    getPrProjectsByCompany: (companyId: string, page = 0, size = 20) =>
        api.get<PageResponse<PrProjectResponse>>(`/staff/pr-projects/company/${companyId}?page=${page}&size=${size}`).then(r => r.data),

    createPrProject: (data: { companyId: string; name: string; purpose?: string; totalPhases?: number; phaseNames?: string[]; memberIds?: string[] }) =>
        api.post<PrProjectResponse>('/staff/pr-projects', data).then(r => r.data),

    completePrPhase: (projectId: string, phaseId: string) =>
        api.post<PrProjectResponse>(`/staff/pr-projects/${projectId}/phases/${phaseId}/complete`).then(r => r.data),

    deletePrProject: (id: string) =>
        api.delete(`/staff/pr-projects/${id}`).then(r => r.data),

    // Notes
    getNotes: (page = 0, size = 20, companyId?: string) =>
        api.get<PageResponse<NoteResponse>>(`/staff/notes?page=${page}&size=${size}${companyId ? `&companyId=${companyId}` : ''}`).then(r => r.data),

    createNote: (data: { content: string; companyId?: string }) =>
        api.post<NoteResponse>('/staff/notes', data).then(r => r.data),

    toggleNote: (id: string) =>
        api.put<NoteResponse>(`/staff/notes/${id}/toggle`).then(r => r.data),

    deleteNote: (id: string) =>
        api.delete(`/staff/notes/${id}`).then(r => r.data),
};
