import api from './client';

export const settingsApi = {
    updateProfile: (data: { fullName: string }) =>
        api.put<{ fullName: string }>('/settings/profile', data).then(r => r.data),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        api.put<{ message?: string; error?: string }>('/settings/password', data).then(r => r.data),

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<{ avatarUrl?: string; error?: string }>('/settings/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
    },
};
