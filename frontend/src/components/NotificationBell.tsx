import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type NotificationResponse } from '../api/features';
import { useNotifications } from '../hooks/useNotifications';

const typeIcons: Record<string, string> = {
    TASK_ASSIGNED: '📋',
    TASK_COMPLETED: '✅',
    TASK_OVERDUE: '⏰',
    MESSAGE_RECEIVED: '💬',
    APPROVAL_REQUEST: '🔔',
    APPROVAL_DECIDED: '✔️',
    MEETING_REMINDER: '📅',
    SHOOT_REMINDER: '📷',
    SURVEY_REQUEST: '⭐',
    FILE_SHARED: '📎',
    SYSTEM: '⚙️',
};

interface Props {
    accentColor?: string;
}

export default function NotificationBell({ accentColor = 'orange' }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markRead = async (n: NotificationResponse) => {
        if (!n.isRead) await markAsRead(n.id);
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Az önce';
        if (minutes < 60) return `${minutes}dk`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}sa`;
        return `${Math.floor(hours / 24)}g`;
    };

    const colorMap: Record<string, string> = {
        orange: 'bg-orange-500',
        pink: 'bg-pink-500',
        blue: 'bg-blue-500',
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-xl hover:bg-white/[0.06] transition-colors text-zinc-400 hover:text-zinc-200"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center ${colorMap[accentColor] || 'bg-orange-500'} text-white text-[9px] font-bold rounded-full px-1`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-[380px] bg-[#0C0C0E] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                        <h3 className="text-sm font-bold text-white">Bildirimler</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Tümünü oku
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                                <Bell className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-[13px]">Bildirim yok</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <button
                                    key={n.id}
                                    onClick={() => { markRead(n); setOpen(false); }}
                                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0 ${!n.isRead ? 'bg-white/[0.02]' : ''}`}
                                >
                                    <span className="text-lg mt-0.5">{typeIcons[n.type] || '🔔'}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] font-medium truncate ${n.isRead ? 'text-zinc-400' : 'text-white'}`}>
                                            {n.title}
                                        </p>
                                        {n.message && (
                                            <p className="text-[12px] text-zinc-600 truncate mt-0.5">{n.message}</p>
                                        )}
                                        <p className="text-[10px] text-zinc-700 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>
                                    {!n.isRead && (
                                        <div className={`w-2 h-2 rounded-full mt-1.5 ${colorMap[accentColor] || 'bg-orange-500'}`} />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <button
                            onClick={() => { navigate('/notifications'); setOpen(false); }}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-[12px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-colors border-t border-white/[0.06]"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Tümünü Gör
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
