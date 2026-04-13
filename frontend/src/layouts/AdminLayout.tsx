import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useUnreadCount } from '../hooks/useUnreadCount';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
    LayoutDashboard, Building2, Users, LogOut, Shield, MessageSquare, Zap, Menu, X, BarChart3, Activity, Search, Settings, UserCog, RefreshCw
} from 'lucide-react';

const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Kontrol Paneli', end: true },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analitik' },
    { to: '/admin/companies', icon: Building2, label: 'Şirketler' },
    { to: '/admin/staff', icon: Users, label: 'Çalışanlar' },
    { to: '/admin/users', icon: UserCog, label: 'Kullanıcılar' },
    { to: '/admin/messaging', icon: MessageSquare, label: 'Mesajlar' },
    { to: '/admin/routines', icon: RefreshCw, label: 'Rutin Görevler' },
    { to: '/admin/activity-log', icon: Activity, label: 'Aktivite Günlüğü' },
    { to: '/admin/settings', icon: Settings, label: 'Ayarlar' },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const msgCount = useUnreadCount();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-dvh bg-transparent">
            {/* Mobile Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-[#0C0C0E] border-b border-white/[0.06] md:hidden">
                <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-white" />
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
                fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0C0C0E] border-r border-white/[0.06] flex flex-col
                transform transition-transform duration-200 ease-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:sticky md:top-0 md:h-dvh md:translate-x-0 md:z-auto
            `}>
                {/* Logo */}
                <div className="px-5 py-5 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold tracking-tight leading-none text-white">
                                FOG<span className="text-zinc-500 font-normal">istanbul</span>
                            </h1>
                            <p className="text-[10px] text-zinc-600 font-medium mt-0.5">Yönetim Paneli</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-white/[0.06] text-zinc-500 md:hidden">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-2">Menü</p>
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${isActive
                                    ? 'bg-orange-500/10 text-orange-400'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                                }`
                            }
                        >
                            <item.icon className="w-[18px] h-[18px]" />
                            <span className="flex-1">{item.label}</span>
                            {item.label === 'Mesajlar' && msgCount > 0 && (
                                <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-orange-500 text-white text-[9px] font-bold rounded-full px-1">
                                    {msgCount > 99 ? '99+' : msgCount}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div className="px-3 pb-4 space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                            <Shield className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-white font-medium truncate">{user?.fullName || 'Admin'}</p>
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

            {/* Main */}
            <main className="flex-1 overflow-auto pt-14 md:pt-0">
                {/* Desktop Header Bar */}
                <div className="hidden md:flex items-center justify-end gap-2 px-8 py-3 border-b border-white/[0.06]">
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
                    <NotificationBell accentColor="orange" />
                </div>
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
            <GlobalSearch />
        </div>
    );
}
