import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { clientApi } from '../api/clientPanel';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import FogLogo from '../components/brand/FogLogo';
import {
    BarChart3, Image, ListTodo, CheckCircle2, ShoppingBag,
    Settings, MessageSquare, LogOut, Star, Menu, X, TrendingUp, Sparkles, Search, Users, Camera
} from 'lucide-react';

const navItems = [
    { to: '/client', icon: BarChart3, label: 'Raporlar', end: true },
    { to: '/client/analytics', icon: TrendingUp, label: 'Analitik' },
    { to: '/client/media', icon: Image, label: 'Medya Kütüphanesi' },
    { to: '/client/tasks', icon: ListTodo, label: 'Yapılacaklar' },
    { to: '/client/completed', icon: CheckCircle2, label: 'Yapılanlar' },
    { to: '/client/shoots', icon: Camera, label: 'Çekim Takvimi' },
    { to: '/client/services', icon: ShoppingBag, label: 'Ek Hizmet Al', ownerOnly: true },
    { to: '/client/messaging', icon: MessageSquare, label: 'Mesajlar' },
    { to: '/client/team', icon: Users, label: 'Ekibimiz', ownerOnly: true },
    { to: '/client/surveys', icon: Star, label: 'Memnuniyet Anketi', ownerOnly: true },
    { to: '/client/onboarding', icon: Sparkles, label: 'Başlangıç Rehberi', ownerOnly: true },
    { to: '/client/settings', icon: Settings, label: 'Ayarlar' },
];

export default function ClientLayout() {
    const { user, logout } = useAuth();
    const msgCount = useUnreadCount(clientApi.getMyConversations);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isOwner = user?.membershipRole === 'OWNER';
    const filteredNavItems = navItems.filter(item => !item.ownerOnly || isOwner);

    return (
        <div className="fog-client-shell flex min-h-dvh">
            {/* Mobile Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-[#0A0A0C]/90 backdrop-blur-xl border-b border-white/[0.06] md:hidden">
                <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-300">
                    <Menu className="w-5 h-5" />
                </button>
                <FogLogo className="text-[15px]" tone="pink" />
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-[272px] flex flex-col
                bg-[#0A0A0C]/95 backdrop-blur-2xl border-r border-white/[0.06]
                transform transition-transform duration-200 ease-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:sticky md:top-0 md:h-dvh md:translate-x-0 md:z-auto
            `}
                style={{
                    backgroundImage: 'radial-gradient(600px 300px at 50% 0%, rgba(209, 24, 28, 0.08), transparent 60%)',
                }}
            >
                {/* Brand */}
                <div className="px-6 pt-6 pb-5 flex items-center justify-between relative">
                    <div className="flex flex-col gap-1">
                        <FogLogo className="text-[19px] leading-none" tone="pink" />
                        <div className="flex items-center gap-1.5">
                            <span className="fog-accent-dot inline-block w-1 h-1 rounded-full" />
                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-[0.18em]">Müşteri Portalı</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-white/[0.06] text-zinc-500 md:hidden">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="fog-divider mx-6" />

                {/* Navigation */}
                <nav className="flex-1 px-4 py-5 space-y-0.5 overflow-y-auto">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.18em] px-3 mb-3">Menü</p>
                    {filteredNavItems.map(({ to, icon: Icon, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `fog-nav-item ${isActive ? 'active' : ''} flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium ${isActive
                                    ? ''
                                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                                }`
                            }
                        >
                            <Icon className="w-[18px] h-[18px]" />
                            <span className="flex-1">{label}</span>
                            {label === 'Mesajlar' && msgCount > 0 && (
                                <span className="min-w-[20px] h-[18px] flex items-center justify-center text-white text-[10px] font-bold rounded-full px-1.5"
                                    style={{ background: 'linear-gradient(135deg, #D1181C, #C8697A)', boxShadow: '0 4px 10px -2px rgba(209,24,28,0.5)' }}>
                                    {msgCount > 99 ? '99+' : msgCount}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="fog-divider mx-6" />

                {/* User info */}
                <div className="px-4 py-4 space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shadow-lg"
                            style={{
                                background: 'linear-gradient(135deg, #D1181C 0%, #C8697A 100%)',
                                boxShadow: '0 8px 20px -6px rgba(209,24,28,0.5)'
                            }}
                        >
                            {user?.fullName?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-white font-semibold truncate">{user?.fullName}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-zinc-500 hover:text-[#F5BEC8] hover:bg-[#D1181C]/8 w-full transition-all"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto pt-14 md:pt-0 relative z-10">
                {/* Desktop Header Bar */}
                <div className="hidden md:flex items-center justify-end gap-2 px-8 py-3.5 border-b border-white/[0.05] bg-[#0A0A0C]/40 backdrop-blur-xl sticky top-0 z-20">
                    <button
                        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[11px] text-zinc-500 hover:text-[#F5BEC8] hover:border-[#C8697A]/25 transition-all"
                    >
                        <Search className="w-3.5 h-3.5" />
                        Ara...
                        <kbd className="bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 font-mono text-[9px]">Ctrl+K</kbd>
                    </button>
                    <ThemeToggle />
                    <LanguageSwitcher />
                    <NotificationBell accentColor="pink" />
                </div>
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
            <GlobalSearch />
        </div>
    );
}
