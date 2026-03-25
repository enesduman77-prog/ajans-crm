import { useEffect, useRef, useCallback, useState } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import type { MessageResponse } from '../api/messaging';

interface UseWebSocketOptions {
    conversationId: string | null;
    userId?: string | null;
    onMessage?: (message: MessageResponse) => void;
    onGlobalMessage?: (message: MessageResponse) => void;
    onReadReceipt?: (data: { conversationId: string; readBy: string }) => void;
    enabled?: boolean;
}

export function useWebSocket({ conversationId, userId, onMessage, onGlobalMessage, onReadReceipt, enabled = true }: UseWebSocketOptions) {
    const clientRef = useRef<Client | null>(null);
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;
    const onGlobalMessageRef = useRef(onGlobalMessage);
    onGlobalMessageRef.current = onGlobalMessage;
    const onReadReceiptRef = useRef(onReadReceipt);
    onReadReceiptRef.current = onReadReceipt;
    const [connected, setConnected] = useState(false);

    const connect = useCallback(() => {
        if (!enabled || clientRef.current?.connected) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            onConnect: () => {
                setConnected(true);
                console.log('[WS] Connected');
            },
            onDisconnect: () => {
                setConnected(false);
                console.log('[WS] Disconnected');
            },
            onStompError: (frame: { headers: Record<string, string> }) => {
                console.error('[WS] STOMP error:', frame.headers.message);
            },
        });

        client.activate();
        clientRef.current = client;
    }, [enabled]);

    // Subscribe to conversation
    useEffect(() => {
        const client = clientRef.current;
        if (!client?.connected || !conversationId) return;

        const subscription = client.subscribe(
            `/topic/thread/${conversationId}`,
            (message: IMessage) => {
                try {
                    const parsed: MessageResponse = JSON.parse(message.body);
                    onMessageRef.current?.(parsed);
                } catch (err) {
                    console.error('[WS] Parse error:', err);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [conversationId, connected]);

    // Subscribe to user-specific topic for global message notifications
    useEffect(() => {
        const client = clientRef.current;
        if (!client?.connected || !userId) return;

        const subscription = client.subscribe(
            `/topic/user/${userId}`,
            (message: IMessage) => {
                try {
                    const parsed: MessageResponse = JSON.parse(message.body);
                    onGlobalMessageRef.current?.(parsed);
                } catch (err) {
                    console.error('[WS] Global parse error:', err);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [userId, connected]);

    // Subscribe to read receipts for active conversation
    useEffect(() => {
        const client = clientRef.current;
        if (!client?.connected || !conversationId) return;

        const subscription = client.subscribe(
            `/topic/read/${conversationId}`,
            (message: IMessage) => {
                try {
                    const parsed = JSON.parse(message.body);
                    onReadReceiptRef.current?.(parsed);
                } catch (err) {
                    console.error('[WS] Read receipt parse error:', err);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [conversationId, connected]);

    // Connect on mount
    useEffect(() => {
        connect();
        return () => {
            clientRef.current?.deactivate();
            clientRef.current = null;
            setConnected(false);
        };
    }, [connect]);

    const sendMessage = useCallback((targetConversationId: string, content: string) => {
        const client = clientRef.current;
        if (!client?.connected) {
            console.warn('[WS] Not connected, cannot send');
            return false;
        }
        client.publish({
            destination: `/app/chat/${targetConversationId}`,
            body: JSON.stringify({ content, requiresApproval: false }),
        });
        return true;
    }, []);

    return { connected, sendMessage };
}
