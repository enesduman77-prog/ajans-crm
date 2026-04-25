import api from './client';

export interface DashboardStats {
    totalCompanies: number;
    activeCompanies: number;
    totalStaff: number;
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
}

export interface CompanyResponse {
    id: string;
    kind: string;
    name: string;
    industry: string;
    email: string;
    phone: string;
    logoUrl: string;
    contractStatus: string;
    memberCount: number;
    employeeCount: number;
    staffCount: number;
    taskCount: number;
    createdAt: string;
    members?: MembershipInfo[];
    taxId?: string;
    foundedYear?: number;
    address?: string;
    website?: string;
    notes?: string;
    socialInstagram?: string;
    socialFacebook?: string;
    socialTwitter?: string;
    socialLinkedin?: string;
    socialYoutube?: string;
    socialTiktok?: string;
    hostingProvider?: string | null;
    domainExpiry?: string | null;
    sslExpiry?: string | null;
    cmsType?: string | null;
    cmsVersion?: string | null;
    themeName?: string | null;
}

export interface MembershipInfo {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    membershipRole: string;
    globalRole: string;
    avatarUrl: string;
}

export interface StaffResponse {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    avatarUrl: string;
    globalRole: string;
    assignedCompanies: { membershipId: string; companyId: string; companyName: string; membershipRole: string }[];
}

export interface CreateCompanyRequest {
    name: string;
    industry?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    notes?: string;
    taxId?: string;
    foundedYear?: number;
    socialInstagram?: string;
    socialFacebook?: string;
    socialTwitter?: string;
    socialLinkedin?: string;
    socialYoutube?: string;
    socialTiktok?: string;
    ownerFullName: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerPhone?: string;
    ownerPosition?: string;
}

export interface UpdateCompanyRequest {
    name: string;
    industry?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    notes?: string;
    taxId?: string;
    foundedYear?: number;
    vision?: string;
    mission?: string;
    employeeCount?: number;
    socialInstagram?: string;
    socialFacebook?: string;
    socialTwitter?: string;
    socialLinkedin?: string;
    socialYoutube?: string;
    socialTiktok?: string;
    hostingProvider?: string | null;
    domainExpiry?: string | null;
    sslExpiry?: string | null;
    cmsType?: string | null;
    cmsVersion?: string | null;
    themeName?: string | null;
}

export interface CompanyInfrastructureRequest {
    hostingProvider?: string | null;
    domainExpiry?: string | null;
    sslExpiry?: string | null;
    cmsType?: string | null;
    cmsVersion?: string | null;
    themeName?: string | null;
}

export interface CreateStaffRequest {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    position?: string;
    department?: string;
    initialCompanyId?: string;
}

export interface AddEmployeeRequest {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    position?: string;
    department?: string;
}

export interface UserCompanyInfo {
    companyId: string;
    companyName: string;
    membershipRole: string;
}

export interface AllUserResponse {
    id: string;
    fullName: string;
    email: string;
    globalRole: string;
    membershipRole: string | null;
    avatarUrl: string | null;
    phone: string | null;
    position: string | null;
    department: string | null;
    companies: UserCompanyInfo[];
    createdAt: string;
}

export interface PermissionResponse {
    id: string | null;
    userId: string;
    companyId: string;
    permissionKey: string;
    level: string;
    createdAt: string | null;
}

export interface UpdatePermissionRequest {
    userId: string;
    companyId: string;
    permissionKey: string;
    level: string;
}

export const adminApi = {
    getStats: () => api.get<DashboardStats>('/admin/dashboard/stats').then(r => r.data),

    // Companies
    getCompanies: () => api.get<CompanyResponse[]>('/admin/companies').then(r => r.data),
    getCompany: (id: string) => api.get<CompanyResponse>(`/admin/companies/${id}`).then(r => r.data),
    createCompany: (data: CreateCompanyRequest) => api.post<CompanyResponse>('/admin/companies', data).then(r => r.data),
    updateCompany: (id: string, data: UpdateCompanyRequest) => api.put<CompanyResponse>(`/admin/companies/${id}`, data).then(r => r.data),
    updateCompanyInfrastructure: (id: string, data: CompanyInfrastructureRequest) =>
        api.put<CompanyResponse>(`/admin/companies/${id}/infrastructure`, data).then(r => r.data),
    deleteCompany: (id: string) => api.delete(`/admin/companies/${id}`).then(r => r.data),

    // Company employees
    addEmployee: (companyId: string, data: AddEmployeeRequest) =>
        api.post(`/admin/companies/${companyId}/employees`, data).then(r => r.data),
    removeEmployee: (companyId: string, userId: string) =>
        api.delete(`/admin/companies/${companyId}/employees/${userId}`).then(r => r.data),

    // Staff
    getStaff: () => api.get<StaffResponse[]>('/admin/staff').then(r => r.data),
    getStaffById: (id: string) => api.get<StaffResponse>(`/admin/staff/${id}`).then(r => r.data),
    createStaff: (data: CreateStaffRequest) => api.post<StaffResponse>('/admin/staff', data).then(r => r.data),
    deleteStaff: (id: string) => api.delete(`/admin/staff/${id}`).then(r => r.data),
    assignStaff: (staffId: string, companyId: string) =>
        api.post(`/admin/staff/${staffId}/assign/${companyId}`).then(r => r.data),
    unassignStaff: (membershipId: string) =>
        api.delete(`/admin/staff/membership/${membershipId}`).then(r => r.data),

    // Permissions
    getPermissions: (userId: string, companyId: string) =>
        api.get<PermissionResponse[]>(`/admin/permissions?userId=${userId}&companyId=${companyId}`).then(r => r.data),
    updatePermission: (data: UpdatePermissionRequest) =>
        api.put<PermissionResponse>('/admin/permissions', data).then(r => r.data),
    getPermissionKeys: () =>
        api.get<string[]>('/admin/permissions/keys').then(r => r.data),
    setDefaultPermissions: (userId: string, companyId: string, role: string) =>
        api.post(`/admin/permissions/defaults?userId=${userId}&companyId=${companyId}&role=${role}`).then(r => r.data),

    // Users
    getAllUsers: () => api.get<AllUserResponse[]>('/admin/users').then(r => r.data),
    updateUserRole: (userId: string, globalRole: string) =>
        api.put(`/admin/users/${userId}/role`, { globalRole }).then(r => r.data),
    deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),

    // Routines
    getRoutines: (page = 0, size = 50) =>
        api.get<PageResponse<AdminRoutineResponse>>(`/admin/routines?page=${page}&size=${size}`).then(r => r.data),
    getRoutine: (id: string) =>
        api.get<AdminRoutineResponse>(`/admin/routines/${id}`).then(r => r.data),
    createRoutine: (data: CreateRoutineRequest) =>
        api.post<AdminRoutineResponse>('/admin/routines', data).then(r => r.data),
    updateRoutine: (id: string, data: UpdateRoutineRequest) =>
        api.put<AdminRoutineResponse>(`/admin/routines/${id}`, data).then(r => r.data),
    deleteRoutine: (id: string) =>
        api.delete(`/admin/routines/${id}`).then(r => r.data),
};

// --- Routine Types ---
export interface AdminRoutineResponse {
    id: string;
    title: string;
    description: string | null;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    executionTime: string | null;
    assignedToId: string | null;
    assignedToName: string;
    category: string;
    isActive: boolean;
    createdById: string;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRoutineRequest {
    title: string;
    description?: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    dayOfWeek?: number;
    dayOfMonth?: number;
    executionTime?: string;
    assignedToId?: string;
    category?: string;
}

export interface UpdateRoutineRequest {
    title?: string;
    description?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    dayOfWeek?: number;
    dayOfMonth?: number;
    executionTime?: string;
    assignedToId?: string;
    category?: string;
    isActive?: boolean;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
