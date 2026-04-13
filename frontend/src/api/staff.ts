import api from './client';
import type { CompanyResponse } from './admin';

// --- Types ---
export interface TaskResponse {
    id: string;
    companyId: string | null;
    companyName: string | null;
    assignedToId: string;
    assignedToName: string;
    createdById: string;
    createdByName: string;
    title: string;
    description: string | null;
    category: string;
    status: string;
    startDate: string | null;
    startTime: string | null;
    endDate: string | null;
    endTime: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskRequest {
    companyId?: string;
    assignedToId: string;
    title: string;
    description?: string;
    category?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: string;
    category?: string;
    assignedToId?: string;
    companyId?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
}

export interface AssignableUser {
    id: string;
    fullName: string;
    email: string;
    globalRole: string;
    avatarUrl: string | null;
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

export interface TaskNoteResponse {
    id: string;
    taskId: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
}

export interface MeetingResponse {
    id: string;
    companyId: string | null;
    companyName: string | null;
    title: string;
    description: string | null;
    meetingDate: string;
    durationMinutes: number | null;
    location: string | null;
    status: string;
    createdById: string;
    createdByName: string;
    participants: { userId: string; fullName: string; email: string; noteSubmitted: boolean }[];
    notes: { userId: string; fullName: string; content: string; createdAt: string }[];
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
    photographerId: string | null;
    photographerName: string | null;
    notes: string | null;
    createdById: string;
    createdByName: string;
    participants: { userId: string; fullName: string; roleInShoot: string | null }[];
    equipment: { id: string; name: string; quantity: number; notes: string | null }[];
    createdAt: string;
}

export interface PrProjectResponse {
    id: string;
    companyId: string | null;
    companyName: string | null;
    name: string;
    purpose: string | null;
    totalPhases: number;
    currentPhase: number;
    progressPercent: number;
    status: string;
    createdById: string;
    createdByName: string;
    responsibleId: string | null;
    responsibleName: string | null;
    startDate: string | null;
    endDate: string | null;
    notes: string | null;
    phases: PrPhaseInfo[];
    members: { userId: string; fullName: string }[];
    createdAt: string;
}

export interface PrPhaseInfo {
    id: string;
    phaseNumber: number;
    name: string;
    isCompleted: boolean;
    completedAt: string | null;
    assignedToId: string | null;
    assignedToName: string | null;
    startDate: string | null;
    endDate: string | null;
    notes: string | null;
    status: string;
    phaseNotes: PhaseNoteInfo[];
}

export interface PhaseNoteInfo {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
}

export interface CreatePrProjectRequest {
    name: string;
    companyId?: string;
    responsibleId?: string;
    purpose?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
    totalPhases?: number;
    phases?: { name: string; assignedToId?: string; startDate?: string; endDate?: string; notes?: string }[];
    memberIds?: string[];
}

export interface UpdatePrProjectRequest {
    name?: string;
    purpose?: string;
    companyId?: string;
    responsibleId?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
    status?: string;
    phases?: { id?: string; name?: string; assignedToId?: string; startDate?: string; endDate?: string; notes?: string }[];
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

    getAssignableUsers: (companyId?: string) =>
        api.get<AssignableUser[]>(`/staff/tasks/assignable-users${companyId ? `?companyId=${companyId}` : ''}`).then(r => r.data),

    getTaskNotes: (taskId: string) =>
        api.get<TaskNoteResponse[]>(`/staff/tasks/${taskId}/notes`).then(r => r.data),

    addTaskNote: (taskId: string, content: string) =>
        api.post<TaskNoteResponse>(`/staff/tasks/${taskId}/notes`, { content }).then(r => r.data),

    deleteTaskNote: (noteId: string) =>
        api.delete(`/staff/tasks/notes/${noteId}`).then(r => r.data),

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

    createMeeting: (data: { companyId?: string; title: string; description?: string; meetingDate: string; durationMinutes?: number; location?: string; participantIds?: string[] }) =>
        api.post<MeetingResponse>('/staff/meetings', data).then(r => r.data),

    updateMeetingStatus: (id: string, status: string) =>
        api.put<MeetingResponse>(`/staff/meetings/${id}/status?status=${status}`).then(r => r.data),

    deleteMeeting: (id: string) =>
        api.delete(`/staff/meetings/${id}`).then(r => r.data),

    completeMeeting: (id: string, content: string) =>
        api.put<MeetingResponse>(`/staff/meetings/${id}/complete`, { content }).then(r => r.data),

    addMeetingNote: (id: string, content: string) =>
        api.post<MeetingResponse>(`/staff/meetings/${id}/notes`, { content }).then(r => r.data),

    getMeeting: (id: string) =>
        api.get<MeetingResponse>(`/staff/meetings/${id}`).then(r => r.data),

    // Shoots
    getShoots: (page = 0, size = 20) =>
        api.get<PageResponse<ShootResponse>>(`/staff/shoots?page=${page}&size=${size}`).then(r => r.data),

    getShootsByCompany: (companyId: string, page = 0, size = 20) =>
        api.get<PageResponse<ShootResponse>>(`/staff/shoots/company/${companyId}?page=${page}&size=${size}`).then(r => r.data),

    createShoot: (data: { companyId: string; title: string; description?: string; shootDate?: string; shootTime?: string; location?: string; photographerId?: string; notes?: string; participants?: { userId: string; roleInShoot: string }[]; equipment?: { name: string; quantity?: number; notes?: string }[] }) =>
        api.post<ShootResponse>('/staff/shoots', data).then(r => r.data),

    updateShootStatus: (id: string, status: string) =>
        api.put<ShootResponse>(`/staff/shoots/${id}/status?status=${status}`).then(r => r.data),

    deleteShoot: (id: string) =>
        api.delete(`/staff/shoots/${id}`).then(r => r.data),

    // PR Projects
    getPrProjects: (page = 0, size = 20) =>
        api.get<PageResponse<PrProjectResponse>>(`/staff/pr-projects?page=${page}&size=${size}`).then(r => r.data),

    getPrProject: (id: string) =>
        api.get<PrProjectResponse>(`/staff/pr-projects/${id}`).then(r => r.data),

    getPrProjectsByCompany: (companyId: string, page = 0, size = 20) =>
        api.get<PageResponse<PrProjectResponse>>(`/staff/pr-projects/company/${companyId}?page=${page}&size=${size}`).then(r => r.data),

    createPrProject: (data: CreatePrProjectRequest) =>
        api.post<PrProjectResponse>('/staff/pr-projects', data).then(r => r.data),

    updatePrProject: (id: string, data: UpdatePrProjectRequest) =>
        api.put<PrProjectResponse>(`/staff/pr-projects/${id}`, data).then(r => r.data),

    completePrPhase: (projectId: string, phaseId: string) =>
        api.post<PrProjectResponse>(`/staff/pr-projects/${projectId}/phases/${phaseId}/complete`).then(r => r.data),

    deletePrProject: (id: string) =>
        api.delete(`/staff/pr-projects/${id}`).then(r => r.data),

    addPrPhaseNote: (projectId: string, phaseId: string, content: string) =>
        api.post<PrProjectResponse>(`/staff/pr-projects/${projectId}/phases/${phaseId}/notes`, { content }).then(r => r.data),

    // Notes
    getNotes: (page = 0, size = 20, companyId?: string) =>
        api.get<PageResponse<NoteResponse>>(`/staff/notes?page=${page}&size=${size}${companyId ? `&companyId=${companyId}` : ''}`).then(r => r.data),

    createNote: (data: { content: string; companyId?: string }) =>
        api.post<NoteResponse>('/staff/notes', data).then(r => r.data),

    toggleNote: (id: string) =>
        api.put<NoteResponse>(`/staff/notes/${id}/toggle`).then(r => r.data),

    deleteNote: (id: string) =>
        api.delete(`/staff/notes/${id}`).then(r => r.data),

    // Analytics
    getMyAnalytics: () =>
        api.get<StaffAnalyticsResponse>('/staff/analytics').then(r => r.data),
};

// --- Analytics Types ---
export interface StaffAnalyticsResponse {
    activeTasks: number;
    completedThisWeek: number;
    pendingTasks: number;
    completionRate: number;
    totalMinutesThisMonth: number;
    overdueTasks: number;
    weeklyFlow: { name: string; tamamlanan: number; yeni: number }[];
    monthlyHours: { name: string; saat: number }[];
    companyTasks: { label: string; value: number; max: number; color: string }[];
}
