import api from './client';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface UserInfo {
    id: string;
    email: string;
    fullName: string;
    globalRole: 'ADMIN' | 'AGENCY_STAFF' | 'COMPANY_USER';
    membershipRole: 'OWNER' | 'EMPLOYEE' | 'AGENCY_STAFF' | null;
    avatarUrl: string | null;
}

export const authApi = {
    csrf: () => api.get('/auth/csrf'),

    login: (data: LoginRequest) =>
        api.post<UserInfo>('/auth/login', data).then((r) => r.data),

    refresh: () =>
        api.post<UserInfo>('/auth/refresh').then((r) => r.data),

    logout: () =>
        api.post('/auth/logout'),

    me: () =>
        api.get<UserInfo | null>('/auth/me').then((r) => r.data ?? null),
};
