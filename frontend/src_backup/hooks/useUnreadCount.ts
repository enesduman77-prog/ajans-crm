import { useState, useEffect, useCallback } from 'react';
import { messagingApi, type ConversationResponse } from '../api/messaging';

type FetchFn = () => Promise<ConversationResponse[]>;

export function useUnreadCount(fetchFn?: FetchFn, intervalMs = 10000) {
    const [count, setCount] = useState(0);

    const actualFetch = fetchFn || messagingApi.getMyConversations;

    const fetchCount = useCallback(async () => {
        try {
            const conversations = await actualFetch();
            const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            setCount(totalUnread);
        } catch {
            // silently ignore
        }
    }, [actualFetch]);

    useEffect(() => {
        fetchCount();
        const id = setInterval(fetchCount, intervalMs);
        return () => clearInterval(id);
    }, [fetchCount, intervalMs]);

    return count;
}
