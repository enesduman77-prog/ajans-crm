import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientApi } from '../../api/clientPanel';
import type { ShootResponse, ShootParticipantInfo, ShootEquipmentInfo } from '../../api/clientPanel';
import type { ContentPlanResponse } from '../../api/contentPlan';
import type { PageResponse } from '../../api/staff';
import {
    Camera, MapPin, Calendar, Clock, User, Users, Package,
    FileText, X, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Loader2
} from 'lucide-react';

type ShootTab = 'PLANNED' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PLANNED:   { label: 'Planlandı',   className: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
    OVERDUE:   { label: 'Gecikmiş',    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    COMPLETED: { label: 'Tamamlandı',  className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    CANCELLED: { label: 'İptal',       className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
};

const CONTENT_STATUS: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: 'Taslak', cls: 'bg-zinc-500/10 text-zinc-400' },
    WAITING_APPROVAL: { label: 'Onay Bekliyor', cls: 'bg-amber-500/10 text-amber-400' },
    REVISION: { label: 'Revize', cls: 'bg-orange-500/10 text-orange-400' },
    APPROVED: { label: 'Onaylandı', cls: 'bg-emerald-500/10 text-emerald-400' },
    PUBLISHED: { label: 'Yayında', cls: 'bg-pink-500/10 text-pink-400' },
};

const PLATFORM_LABEL: Record<string, string> = {
    INSTAGRAM: 'Instagram', TIKTOK: 'TikTok', YOUTUBE: 'YouTube',
    LINKEDIN: 'LinkedIn', TWITTER: 'Twitter', FACEBOOK: 'Facebook',
    WEB: 'Web', OTHER: 'Diğer',
};

function getDisplayStatus(s: ShootResponse): string {
    if (s.status === 'PLANNED' && s.shootDate) {
        const shootDay = new Date(s.shootDate);
        shootDay.setHours(23, 59, 59, 999);
        if (shootDay < new Date()) return 'OVERDUE';
    }
    return s.status;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

function formatTime(time: string | null) {
    if (!time) return null;
    return time.slice(0, 5);
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-zinc-500">{icon}</span>
            <span className="text-[12px] text-zinc-500 w-20 shrink-0">{label}</span>
            <span className="text-sm text-zinc-200">{value}</span>
        </div>
    );
}

/* ─── Detail Modal ────────────────────────────────────── */

function ShootDetailModal({ shoot, onClose }: { shoot: ShootResponse; onClose: () => void }) {
    const displayStatus = getDisplayStatus(shoot);
    const status = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.PLANNED;

    const { data: linkedContent, isLoading: contentLoading } = useQuery<ContentPlanResponse[]>({
        queryKey: ['client-shoot-content', shoot.id],
        queryFn: () => clientApi.getContentByShoot(shoot.id),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#0C0C0E] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                 onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#C8697A]/10 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-[#F5BEC8]" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white leading-snug">{shoot.title}</h2>
                            <span className={`mt-1 inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                                {status.label}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    <div className="grid grid-cols-1 gap-3">
                        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Tarih" value={formatDate(shoot.shootDate)} />
                        {shoot.shootTime && (
                            <InfoRow icon={<Clock className="w-4 h-4" />} label="Saat" value={formatTime(shoot.shootTime) ?? ''} />
                        )}
                        {shoot.location && (
                            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Konum" value={shoot.location} />
                        )}
                        {shoot.photographerName && (
                            <InfoRow icon={<User className="w-4 h-4" />} label="Fotoğrafçı" value={shoot.photographerName} />
                        )}
                    </div>

                    {shoot.description && (
                        <div>
                            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Açıklama</p>
                            <p className="text-sm text-zinc-300 leading-relaxed">{shoot.description}</p>
                        </div>
                    )}

                    {shoot.notes && (
                        <div>
                            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Notlar</p>
                            <div className="bg-white/[0.03] rounded-xl p-3 flex gap-2">
                                <FileText className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-zinc-400 leading-relaxed">{shoot.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Participants */}
                    {shoot.participants.length > 0 && (
                        <div>
                            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" /> Katılımcılar
                            </p>
                            <div className="space-y-2">
                                {shoot.participants.map((p: ShootParticipantInfo) => (
                                    <div key={p.userId} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2">
                                        <span className="text-sm text-zinc-300">{p.fullName}</span>
                                        {p.roleInShoot && (
                                            <span className="text-[11px] text-zinc-500">{p.roleInShoot}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Equipment */}
                    {shoot.equipment.length > 0 && (
                        <div>
                            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5" /> Ekipmanlar
                            </p>
                            <div className="space-y-2">
                                {shoot.equipment.map((eq: ShootEquipmentInfo) => (
                                    <div key={eq.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2">
                                        <span className="text-sm text-zinc-300">{eq.name}</span>
                                        <span className="text-[11px] text-zinc-500">x{eq.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Linked Content Plans */}
                    <div className="border-t border-white/[0.06] pt-5">
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Çekimdeki İçerikler {linkedContent && linkedContent.length > 0 ? `(${linkedContent.length})` : ''}
                        </p>
                        {contentLoading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-5 h-5 text-[#C8697A] animate-spin" />
                            </div>
                        ) : !linkedContent || linkedContent.length === 0 ? (
                            <div className="bg-white/[0.03] rounded-xl p-6 text-center">
                                <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                <p className="text-xs text-zinc-600">Bu çekime henüz içerik bağlanmamış</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {linkedContent.map(cp => {
                                    const st = CONTENT_STATUS[cp.status] ?? CONTENT_STATUS.DRAFT;
                                    return (
                                        <div key={cp.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04] hover:border-[#C8697A]/20 transition-colors">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm text-white font-medium truncate flex-1">{cp.title}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <span className="px-2 py-0.5 rounded bg-[#C8697A]/10 text-[9px] font-bold text-[#F5BEC8]">
                                                    {PLATFORM_LABEL[cp.platform] ?? cp.platform}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${st.cls}`}>
                                                    {st.label}
                                                </span>
                                                {cp.contentSize && (
                                                    <span className="text-[9px] text-zinc-600">{cp.contentSize}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
                                                {cp.authorName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{cp.authorName}</span>}
                                                {cp.plannedDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(cp.plannedDate)}</span>}
                                            </div>
                                            {cp.direction && (
                                                <p className="text-[10px] text-zinc-600 mt-2 line-clamp-2 leading-relaxed">{cp.direction}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ───────────────────────────────────────── */

export default function ClientShootsPage() {
    const [page, setPage] = useState(0);
    const [activeTab, setActiveTab] = useState<ShootTab>('PLANNED');
    const [selectedShoot, setSelectedShoot] = useState<ShootResponse | null>(null);

    const { data, isLoading } = useQuery<PageResponse<ShootResponse>>({
        queryKey: ['client-shoots', page],
        queryFn: () => clientApi.getMyShoots(page, 50),
    });

    const allShoots = data?.content ?? [];

    const categorized = useMemo(() => {
        const result: Record<ShootTab, ShootResponse[]> = { PLANNED: [], OVERDUE: [], COMPLETED: [], CANCELLED: [] };
        allShoots.forEach(s => {
            const ds = getDisplayStatus(s) as ShootTab;
            if (result[ds]) result[ds].push(s);
            else result.PLANNED.push(s);
        });
        return result;
    }, [allShoots]);

    const shoots = categorized[activeTab];

    const TABS: { key: ShootTab; label: string; icon: typeof Camera; color: string }[] = [
        { key: 'PLANNED', label: 'Planlanan', icon: Calendar, color: 'violet' },
        { key: 'OVERDUE', label: 'Gecikmiş', icon: AlertTriangle, color: 'amber' },
        { key: 'COMPLETED', label: 'Tamamlanan', icon: CheckCircle2, color: 'emerald' },
        { key: 'CANCELLED', label: 'İptal', icon: XCircle, color: 'red' },
    ];

    const totalPages = data?.totalPages ?? 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Çekim Takvimi</h1>
                <p className="text-sm text-zinc-500 mt-1">Şirketinize ait fotoğraf / video çekimleri</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {TABS.map(tab => {
                    const count = categorized[tab.key].length;
                    const active = activeTab === tab.key;
                    const Icon = tab.icon;
                    const TAB_ACTIVE: Record<string, string> = {
                        violet: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
                        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                        red: 'bg-red-500/10 text-red-400 border-red-500/30',
                    };
                    const TAB_BADGE: Record<string, string> = {
                        violet: 'bg-violet-500/20', amber: 'bg-amber-500/20', emerald: 'bg-emerald-500/20', red: 'bg-red-500/20',
                    };
                    return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                                active
                                    ? TAB_ACTIVE[tab.color]
                                    : 'bg-transparent text-zinc-500 border-white/[0.06] hover:border-white/[0.12] hover:text-zinc-300'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                            {count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                    active ? TAB_BADGE[tab.color] : 'bg-white/[0.04]'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin h-8 w-8 border-2 border-[#C8697A] border-t-transparent rounded-full" />
                </div>
            ) : shoots.length === 0 ? (
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <Camera className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">Bu kategoride çekim yok</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        {activeTab === 'PLANNED' ? 'Henüz planlanmış çekim bulunmuyor.' :
                         activeTab === 'OVERDUE' ? 'Gecikmiş çekim bulunmuyor.' :
                         activeTab === 'COMPLETED' ? 'Tamamlanmış çekim bulunmuyor.' :
                         'İptal edilmiş çekim bulunmuyor.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {shoots.map((shoot) => {
                            const displayStatus = getDisplayStatus(shoot);
                            const status = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.PLANNED;
                            return (
                                <button
                                    key={shoot.id}
                                    onClick={() => setSelectedShoot(shoot)}
                                    className="w-full text-left bg-[#0C0C0E] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.03] hover:border-white/[0.10] transition-all duration-200 group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-[#C8697A]/10 flex items-center justify-center shrink-0 group-hover:bg-[#B5556A]/15 transition-colors">
                                            <Camera className="w-5 h-5 text-[#F5BEC8]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-white truncate">{shoot.title}</span>
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                                                    {status.label}
                                                </span>
                                                {shoot.linkedContentCount > 0 && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C8697A]/10 text-[10px] font-bold text-[#F5BEC8] border border-[#C8697A]/20">
                                                        <FileText className="w-3 h-3" />
                                                        {shoot.linkedContentCount} içerik
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1.5 flex items-center gap-4 flex-wrap">
                                                <span className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(shoot.shootDate)}
                                                    {shoot.shootTime && ` · ${formatTime(shoot.shootTime)}`}
                                                </span>
                                                {shoot.location && (
                                                    <span className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {shoot.location}
                                                    </span>
                                                )}
                                                {shoot.photographerName && (
                                                    <span className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                                                        <User className="w-3.5 h-3.5" />
                                                        {shoot.photographerName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setPage(p => p - 1)}
                                disabled={page === 0}
                                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-zinc-400">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages - 1}
                                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {selectedShoot && (
                <ShootDetailModal
                    shoot={selectedShoot}
                    onClose={() => setSelectedShoot(null)}
                />
            )}
        </div>
    );
}
