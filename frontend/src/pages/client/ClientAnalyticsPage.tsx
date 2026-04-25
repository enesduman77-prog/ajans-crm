import {
    Globe, Instagram, Search, BarChart3, Activity,
    Camera, MapPin, Clock, Package,
    Users as UsersGroup, Loader2, LayoutTemplate
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { GoogleAnalyticsPanel, SearchConsolePanel, InstagramPanel, ContentPlanPanel, WebDesignPanel } from '../../components/analytics';
import { clientApi, type ShootResponse } from '../../api/clientPanel';
import type { PageResponse } from '../../api/staff';
import { useAuth } from '../../store/AuthContext';

export default function ClientAnalyticsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Raporlar & Analitik</h1>
                    <p className="text-zinc-500 text-[13px] mt-1">Şirketinizin dijital performans metrikleri</p>
                </div>
                <div className="flex items-center gap-2 bg-[#0C0C0E] border border-white/[0.06] rounded-xl px-3 py-2 self-start">
                    <Activity className="w-4 h-4 text-pink-400" />
                    <span className="text-xs text-zinc-400">Canlı Veriler</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                </div>
            </div>

            {/* ═══ WEB TASARIM ═══ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <LayoutTemplate className="w-4 h-4 text-[#F5BEC8]" />
                    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Web Tasarım</h2>
                </div>
                <WebDesignPanel />
            </section>

            {/* ═══ INSTAGRAM ═══ */}
            {user?.companyId && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Instagram className="w-4 h-4 text-pink-400" />
                        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Instagram</h2>
                    </div>
                    <InstagramPanel companyId={user.companyId} />
                </section>
            )}

            {/* ═══ İÇERİK PLANI ═══ */}
            {user?.companyId && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-violet-400" />
                        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">İçerik Planı</h2>
                    </div>
                    <ContentPlanPanel companyId={user.companyId} readOnly />
                </section>
            )}

            {/* ═══ ÇEKİM GÜNLERİ ═══ */}
            <ShootingTimelineSection />

            {/* ═══ SEARCH CONSOLE ═══ */}
            {user?.companyId && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Search className="w-4 h-4 text-pink-400" />
                        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Google Search Console</h2>
                    </div>
                    <SearchConsolePanel companyId={user.companyId} />
                </section>
            )}

            {/* ═══ GOOGLE ANALYTICS ═══ */}
            {user?.companyId && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-[#F5BEC8]" />
                        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Google Analytics</h2>
                    </div>
                    <GoogleAnalyticsPanel companyId={user.companyId} />
                </section>
            )}

        </div>
    );
}

// ============================================================================
// Shooting Timeline Section
// ============================================================================

const SHOOT_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
    PLANNED:   { label: 'Onaylandı',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    COMPLETED: { label: 'Tamamlandı', color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20' },
    CANCELLED: { label: 'İptal',      color: 'text-zinc-400',    bg: 'bg-zinc-500/10',    border: 'border-zinc-500/20' },
};

function ShootingTimelineSection() {
    const { data, isLoading } = useQuery<PageResponse<ShootResponse>>({
        queryKey: ['client-shoots-analytics'],
        queryFn: () => clientApi.getMyShoots(0, 20),
    });

    const shoots = data?.content ?? [];

    if (isLoading) {
        return (
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Camera className="w-4 h-4 text-[#F5BEC8]" />
                    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Çekim Günleri</h2>
                </div>
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6 flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                </div>
            </section>
        );
    }

    if (shoots.length === 0) return null;

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#F5BEC8]" />
                    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Çekim Günleri</h2>
                </div>
                <span className="text-[11px] text-zinc-500">{shoots.length} çekim</span>
            </div>

            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6">
                <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[52px] top-0 bottom-0 w-px bg-gradient-to-b from-[#C8697A]/30 via-white/[0.06] to-transparent" />

                    <div className="space-y-5">
                        {shoots.map((shoot) => {
                            const date = new Date(shoot.shootDate);
                            const day = date.getDate();
                            const monthShort = date.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase().replace('.', '');
                            const st = SHOOT_STATUS[shoot.status] ?? SHOOT_STATUS.PLANNED;

                            return (
                                <div key={shoot.id} className="flex gap-4 group">
                                    {/* Date pill */}
                                    <div className="shrink-0 w-[72px] text-center">
                                        <div className="inline-flex flex-col items-center bg-[#111114] border border-white/[0.08] rounded-xl px-3 py-2 group-hover:border-[#C8697A]/30 transition-colors relative z-10">
                                            <span className="text-[10px] font-bold text-[#C8697A] uppercase tracking-widest">{monthShort}</span>
                                            <span className="text-xl font-bold text-white leading-none mt-0.5">{day}</span>
                                        </div>
                                    </div>

                                    {/* Card */}
                                    <div className="flex-1 bg-[#111114] border border-white/[0.06] rounded-xl p-4 group-hover:border-[#C8697A]/20 group-hover:bg-white/[0.02] transition-all">
                                        {/* Title + status */}
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h5 className="text-sm font-semibold text-white leading-snug">{shoot.title}</h5>
                                            <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.color} border ${st.border}`}>
                                                {st.label}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        {shoot.description && (
                                            <p className="text-[12px] text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                                                {shoot.description}
                                            </p>
                                        )}

                                        {/* Meta grid */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            {shoot.shootTime && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="text-[11px] text-zinc-400">{shoot.shootTime.slice(0, 5)}</span>
                                                </div>
                                            )}
                                            {shoot.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="text-[11px] text-zinc-400">{shoot.location}</span>
                                                </div>
                                            )}
                                            {shoot.participants.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <UsersGroup className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="text-[11px] text-zinc-400">
                                                        Ekip: {shoot.participants.length} Kişi
                                                        {shoot.participants.length <= 3 && (
                                                            <> ({shoot.participants.map(p => p.roleInShoot || p.fullName.split(' ')[0]).join(', ')})</>
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            {shoot.equipment.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="text-[11px] text-zinc-400">
                                                        Ekipman: {shoot.equipment.map(e => e.name).join(', ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
