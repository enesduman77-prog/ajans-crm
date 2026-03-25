import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SockJS
vi.mock('sockjs-client/dist/sockjs', () => {
    return {
        default: vi.fn(function () {
            return {
                send: vi.fn(),
                close: vi.fn(),
            };
        })
    };
});

// Mock StompJS
vi.mock('@stomp/stompjs', () => {
    const ClientMock = vi.fn(function () {
        return {
            activate: vi.fn(),
            deactivate: vi.fn(),
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
            publish: vi.fn(),
            connected: true,
            onConnect: vi.fn(),
            onDisconnect: vi.fn(),
            onStompError: vi.fn(),
        };
    });

    return {
        Client: ClientMock,
    };
});
