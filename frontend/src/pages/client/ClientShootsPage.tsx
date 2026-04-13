import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientApi } from '../../api/clientPanel';
import type { ShootResponse, ShootParticipantInfo, ShootEquipmentInfo } from '../../api/clientPanel';
import type { PageResponse } from '../../api/staff';
import {
    Camera, MapPin, Calendar, Clock, User, Users, Package,
    FileText, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PLANNED:   { label: 'Planlandı',   className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    COMPLETED: { label: 'Tamamlandı',  className: 'bg-pink-500/10 text-pink-400 border border-pink-500/20' },
    CANCELLED: { label: 'İptal',       className: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

function formatTime(time: string | null) {
    if (!time) return null;
    // time comes as HH:mm:ss or HH:mm
    return time.slice(0, 5);
}

interface ShootDetailModalProps {
    shoot: ShootResponse;
    onClose: () => void;
}

function ShootDetailModal({ shoot, onClose }: ShootDetailModalProps) {
    const status = STATUS_CONFIG[shoot.status] ?? STATUS_CONFIG.PLANNED;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0C0C0E] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white leading-snug">{shoot.title}</h2>
                            <span className={`mt-1 inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                                {status.label}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Date / Time / Location */}
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

                    {/* Description */}
                    {shoot.description && (
                        <div>
                            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Açıklama</p>
                            <p className="text-sm text-zinc-300 leading-relaxed">{shoot.description}</p>
                        </div>
                    )}

                    {/* Notes */}
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
                </div>
            </div>
        </div>
    );
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

export default function ClientShootsPage() {
    const [page, setPage] = useState(0);
    const [selectedShoot, setSelectedShoot] = useState<ShootResponse | null>(null);

    const { data, isLoading } = useQuery<PageResponse<ShootResponse>>({
        queryKey: ['client-shoots', page],
        queryFn: () => clientApi.getMyShoots(page, 20),
    });

    const shoots = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Çekim Takvimi</h1>
                <p className="text-sm text-zinc-500 mt-1">Şirketinize ait fotoğraf / video çekimleri</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full" />
                </div>
            ) : shoots.length === 0 ? (
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <Camera className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">Henüz çekim yok</h3>
                    <p className="text-sm text-zinc-500 mt-1">Şirketinize atanmış çekim takvimi bulunmuyor.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {shoots.map((shoot) => {
                            const status = STATUS_CONFIG[shoot.status] ?? STATUS_CONFIG.PLANNED;
                            return (
                                <button
                                    key={shoot.id}
                                    onClick={() => setSelectedShoot(shoot)}
                                    className="w-full text-left bg-[#0C0C0E] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.03] hover:border-white/[0.10] transition-all duration-200 group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/15 transition-colors">
                                            <Camera className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-white truncate">{shoot.title}</span>
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                                                    {status.label}
                                                </span>
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
