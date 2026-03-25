import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useUnreadCount } from '../hooks/useUnreadCount';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';
import TimeTracker from '../components/TimeTracker';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
    LayoutDashboard, ListTodo, Building2, Calendar, CheckCircle2,
    LogOut, Briefcase, Camera, Rocket, MessageSquare, Menu, X, BarChart3,
    LayoutGrid, Clock, FileText, Search, Settings
} from 'lucide-react';
import FloatingTaskFab from '../components/FloatingTaskFab';

const navItems = [
    { to: '/staff', icon: LayoutDashboard, label: 'Ana Panel', end: true },
    { to: '/staff/analytics', icon: BarChart3, label: 'Performansım' },
    { to: '/staff/tasks', icon: ListTodo, label: 'Görevler' },
    { to: '/staff/kanban', icon: LayoutGrid, label: 'Kanban Panosu' },
    { to: '/staff/time-tracking', icon: Clock, label: 'Zaman Takibi' },
    { to: '/staff/messaging', icon: MessageSquare, label: 'Mesajlar' },
    { to: '/staff/notes', icon: FileText, label: 'Notlar' },
    { to: '/staff/companies', icon: Building2, label: 'Şirketler' },
    { to: '/staff/calendar', icon: Calendar, label: 'Takvim' },
    { to: '/staff/pr', icon: Rocket, label: 'PR Projeleri' },
    { to: '/staff/shoots', icon: Camera, label: 'Çekimler' },
    { to: '/staff/completed', icon: CheckCircle2, label: 'Tamamlananlar' },
    { to: '/staff/settings', icon: Settings, label: 'Ayarlar' },
];

export default function StaffLayout() {
    const { user, logout } = useAuth();
    const msgCount = useUnreadCount();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-dvh bg-transparent">
            {/* Mobile Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-[#111113] border-b border-white/[0.06] md:hidden">
                <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Briefcase className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white">FOG<span className="text-zinc-500 font-normal">istanbul</span></span>
                </div>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-[260px] bg-[#111113] border-r border-white/[0.06] flex flex-col
                transform transition-transform duration-200 ease-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:sticky md:top-0 md:h-dvh md:translate-x-0 md:z-auto
            `}>
                {/* Brand */}
                <div className="px-5 py-5 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold tracking-tight leading-none text-white">
                                FOG<span className="text-zinc-500 font-normal">istanbul</span>
                            </h1>
                            <p className="text-[10px] text-zinc-600 font-medium mt-0.5">Çalışan Paneli</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-white/[0.06] text-zinc-500 md:hidden">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-2">Menü</p>
                    {navItems.map(({ to, icon: Icon, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                                }`
                            }
                        >
                            <Icon className="w-[18px] h-[18px]" />
                            <span className="flex-1">{label}</span>
                            {label === 'Mesajlar' && msgCount > 0 && (
                                <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-emerald-500 text-white text-[9px] font-bold rounded-full px-1">
                                    {msgCount > 99 ? '99+' : msgCount}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User info */}
                <div className="px-3 pb-4 space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                            {user?.fullName?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-white font-medium truncate">{user?.fullName}</p>
                            <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-zinc-600 hover:text-red-400 hover:bg-red-500/5 w-full transition-all"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative pt-14 md:pt-0">
                {/* Desktop Header Bar */}
                <div className="hidden md:flex items-center justify-end gap-2 px-8 py-3 border-b border-white/[0.06]">
                    <TimeTracker />
                    <div className="flex-1" />
                    <button
                        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <Search className="w-3.5 h-3.5" />
                        Ara...
                        <kbd className="bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 font-mono text-[9px]">Ctrl+K</kbd>
                    </button>
                    <ThemeToggle />
                    <LanguageSwitcher />
                    <NotificationBell accentColor="emerald" />
                </div>
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
                <FloatingTaskFab />
            </main>
            <GlobalSearch />
        </div>
    );
}
