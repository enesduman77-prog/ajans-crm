import api from './client';

// --- Types ---
export interface ContactResponse {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    globalRole: string;
    email: string;
    companyName: string | null;
    membershipRole: string | null;
    positionTitle: string | null;
}

export interface MessageResponse {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl: string | null;
    content: string;
    isRead: boolean;
    approvalPending: boolean;
    createdAt: string;
}

export interface ConversationResponse {
    id: string;
    otherUserId: string;
    otherUserName: string;
    otherUserAvatarUrl: string | null;
    otherUserRole: string;
    otherUserCompanyName: string | null;
    otherUserMembershipRole: string | null;
    otherUserPositionTitle: string | null;
    updatedAt: string;
    createdAt: string;
    messageCount: number;
    unreadCount: number;
    lastMessage: MessageResponse | null;
}

export interface SendMessageRequest {
    content: string;
    requiresApproval?: boolean;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// --- Group Chat Types ---
export interface GroupMemberInfo {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    membershipRole: string | null;
    positionTitle: string | null;
}

export interface GroupMessageResponse {
    id: string;
    groupId: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl: string | null;
    content: string;
    createdAt: string;
}

export interface GroupConversationResponse {
    id: string;
    name: string;
    companyId: string;
    companyName: string;
    avatarUrl: string | null;
    memberCount: number;
    unreadCount: number;
    updatedAt: string;
    createdAt: string;
    lastMessage: GroupMessageResponse | null;
    members: GroupMemberInfo[];
}

// --- API ---
export const messagingApi = {
    // Contacts
    getContacts: () =>
        api.get<ContactResponse[]>('/staff/messaging/contacts').then(r => r.data),

    // Conversations
    startConversation: (targetUserId: string) =>
        api.post<ConversationResponse>(`/staff/messaging/conversations/start/${targetUserId}`).then(r => r.data),

    getMyConversations: () =>
        api.get<ConversationResponse[]>('/staff/messaging/conversations').then(r => r.data),

    // Messages
    sendMessage: (conversationId: string, data: SendMessageRequest) =>
        api.post<MessageResponse>(`/staff/messaging/conversations/${conversationId}/messages`, data).then(r => r.data),

    getMessages: (conversationId: string, page = 0, size = 50) =>
        api.get<PageResponse<MessageResponse>>(
            `/staff/messaging/conversations/${conversationId}/messages?page=${page}&size=${size}`
        ).then(r => r.data),

    // Approval (if needed)
    approveMessage: (messageId: string) =>
        api.post<MessageResponse>(`/staff/messaging/messages/${messageId}/approve`).then(r => r.data),

    // Mark conversation as read
    markAsRead: (conversationId: string) =>
        api.post(`/staff/messaging/conversations/${conversationId}/read`).then(r => r.data),

    // Group chats
    getMyGroups: () =>
        api.get<GroupConversationResponse[]>('/staff/messaging/groups').then(r => r.data),

    getGroupMessages: (groupId: string, page = 0, size = 50) =>
        api.get<PageResponse<GroupMessageResponse>>(
            `/staff/messaging/groups/${groupId}/messages?page=${page}&size=${size}`
        ).then(r => r.data),

    sendGroupMessage: (groupId: string, data: SendMessageRequest) =>
        api.post<GroupMessageResponse>(`/staff/messaging/groups/${groupId}/messages`, data).then(r => r.data),

    markGroupAsRead: (groupId: string) =>
        api.post(`/staff/messaging/groups/${groupId}/read`).then(r => r.data),
};
