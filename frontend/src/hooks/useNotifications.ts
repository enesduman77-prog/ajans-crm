import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { notificationApi, type NotificationResponse } from '../api/features';
import { useAuth } from '../store/AuthContext';

export function useNotifications() {
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();
    const clientRef = useRef<Client | null>(null);

    const refresh = useCallback(() => {
        notificationApi.getUnreadCount().then(setUnreadCount).catch(() => { });
        notificationApi.getAll(0, 10).then(d => setNotifications(d.content)).catch(() => { });
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // WebSocket subscription for real-time notifications
    useEffect(() => {
        if (!user?.id) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            onConnect: () => {
                client.subscribe(
                    `/user/${user.id}/queue/notifications`,
                    (message: IMessage) => {
                        try {
                            const notification: NotificationResponse = JSON.parse(message.body);
                            setNotifications(prev => [notification, ...prev].slice(0, 10));
                            setUnreadCount(prev => prev + 1);
                        } catch (err) {
                            console.error('[Notifications WS] Parse error:', err);
                        }
                    }
                );
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
            clientRef.current = null;
        };
    }, [user?.id]);

    const markAsRead = useCallback(async (id: string) => {
        await notificationApi.markAsRead(id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }, []);

    const markAllAsRead = useCallback(async () => {
        await notificationApi.markAllAsRead();
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);

    return { notifications, unreadCount, markAsRead, markAllAsRead, refresh };
}
