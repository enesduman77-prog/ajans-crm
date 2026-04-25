import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import { adminApi } from '../../api/admin';
import type { ApprovalRequestResponse } from '../../api/staff';
import type { StaffResponse } from '../../api/admin';
import {
    Inbox, Clock, CheckCircle2, XCircle, Building2, User,
    Calendar, FileText, Camera, MessageSquare, AlertTriangle, Loader2,
    MapPin, Plus, Trash2, X
} from 'lucide-react';

type Tab = 'PENDING' | 'ALL';

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Camera; color: string; bg: string }> = {
    CONTENT_APPROVAL: { label: 'İçerik Onayı', icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    SHOOT_REQUEST: { label: 'Çekim Talebi', icon: Camera, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    TASK_REQUEST: { label: 'Görev Talebi', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    MEETING_REQUEST: { label: 'Toplantı Talebi', icon: MessageSquare, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    GENERAL: { label: 'Genel İstek', icon: Inbox, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'Bekliyor', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    APPROVED: { label: 'Onaylandı', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    REJECTED: { label: 'Reddedildi', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function parseMetadata(metadata: string | null): Record<string, string> {
    if (!metadata) return {};
    const parts = metadata.split('||');
    return {
        shootTitle: parts[0] || '',
        shootDescription: parts[1] || '',
        shootDate: parts[2] || '',
        shootTime: parts[3] || '',
        location: parts[4] || '',
        existingShootId: parts[5] || '',
    };
}

const inputCls = "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-600";
const labelCls = "text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block";

interface EquipmentRow { name: string; quantity: number; notes: string }

function ApproveModal({ req, staffMembers, onClose, onApprove, isLoading }: {
    req: ApprovalRequestResponse;
    staffMembers: StaffResponse[];
    onClose: () => void;
    onApprove: (data: Record<string, unknown>) => void;
    isLoading: boolean;
}) {
    const meta = parseMetadata(req.metadata);
    const isExisting = !!meta.existingShootId;

    const [shootTitle, setShootTitle] = useState(meta.shootTitle || '');
    const [shootDescription, setShootDescription] = useState(meta.shootDescription || '');
    const [shootDate, setShootDate] = useState(meta.shootDate || '');
    const [shootTime, setShootTime] = useState(meta.shootTime || '');
    const [location, setLocation] = useState(meta.location || '');
    const [photographerId, setPhotographerId] = useState('');
    const [notes, setNotes] = useState('');
    const [equipment, setEquipment] = useState<EquipmentRow[]>([]);

    const addEquipment = () => setEquipment(prev => [...prev, { name: '', quantity: 1, notes: '' }]);
    const removeEquipment = (i: number) => setEquipment(prev => prev.filter((_, idx) => idx !== i));
    const updateEquipment = (i: number, field: keyof EquipmentRow, value: string | number) =>
        setEquipment(prev => prev.map((eq, idx) => idx === i ? { ...eq, [field]: value } : eq));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: Record<string, unknown> = {};
        if (!isExisting) {
            data.shootTitle = shootTitle;
            data.shootDescription = shootDescription;
            data.shootDate = shootDate;
            data.shootTime = shootTime;
            data.location = location;
            if (photographerId) data.photographerId = photographerId;
            if (notes) data.notes = notes;
            const validEquip = equipment.filter(eq => eq.name.trim());
            if (validEquip.length > 0) data.equipment = validEquip;
        } else {
            data.existingShootId = meta.existingShootId;
        }
        onApprove(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <div>
                        <h3 className="text-base font-bold text-white">Çekim Onay Formu</h3>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{req.companyName} · {req.requestedByName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {isExisting ? (
                    <div className="p-5 space-y-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-sm text-emerald-400 font-medium">Mevcut çekime bağlanacak</p>
                            <p className="text-xs text-zinc-500 mt-1">Bu istek onaylandığında içerik planı mevcut bir çekime bağlanacaktır.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSubmit} disabled={isLoading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                Onayla
                            </button>
                            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-xs font-semibold hover:bg-white/[0.06] transition-colors">
                                İptal
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Pre-filled from client */}
                        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3 mb-1">
                            <p className="text-[10px] font-semibold text-violet-400/70 uppercase tracking-wider mb-0.5">Müşteriden Gelen Bilgiler</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className={labelCls}>Çekim Başlığı *</label>
                                <input value={shootTitle} onChange={e => setShootTitle(e.target.value)} required className={inputCls} placeholder="Çekim başlığı" />
                            </div>
                            <div>
                                <label className={labelCls}>Tarih</label>
                                <input type="date" value={shootDate} onChange={e => setShootDate(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Saat</label>
                                <input type="time" value={shootTime} onChange={e => setShootTime(e.target.value)} className={inputCls} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelCls}>Konum</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                    <input value={location} onChange={e => setLocation(e.target.value)} className={`${inputCls} pl-8`} placeholder="Çekim konumu" />
                                </div>
                            </div>
                        </div>

                        {/* Admin fills */}
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-wider mb-0.5">Yönetici Tarafından Doldurulacak</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className={labelCls}>Açıklama</label>
                                <textarea value={shootDescription} onChange={e => setShootDescription(e.target.value)} rows={2} className={inputCls} placeholder="Çekim açıklaması..." />
                            </div>
                            <div className="col-span-2">
                                <label className={labelCls}>Çekimci</label>
                                <select value={photographerId} onChange={e => setPhotographerId(e.target.value)} className={inputCls}>
                                    <option value="">— Seçiniz —</option>
                                    {staffMembers.map(s => (
                                        <option key={s.id} value={s.id}>{s.fullName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className={labelCls}>Notlar</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Çekim notları..." />
                            </div>
                        </div>

                        {/* Equipment */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelCls}>Ekipmanlar</label>
                                <button type="button" onClick={addEquipment} className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
                                    <Plus className="w-3 h-3" /> Ekle
                                </button>
                            </div>
                            {equipment.length === 0 && (
                                <p className="text-[11px] text-zinc-600 italic">Ekipman eklenmedi</p>
                            )}
                            <div className="space-y-2">
                                {equipment.map((eq, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input value={eq.name} onChange={e => updateEquipment(i, 'name', e.target.value)} placeholder="Ekipman adı" className={`${inputCls} flex-1`} />
                                        <input type="number" min={1} value={eq.quantity} onChange={e => updateEquipment(i, 'quantity', parseInt(e.target.value) || 1)} className={`${inputCls} w-16 text-center`} />
                                        <input value={eq.notes} onChange={e => updateEquipment(i, 'notes', e.target.value)} placeholder="Not" className={`${inputCls} w-28`} />
                                        <button type="button" onClick={() => removeEquipment(i)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                            <button type="submit" disabled={isLoading || !shootTitle.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                Onayla ve Çekim Oluştur
                            </button>
                            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-xs font-semibold hover:bg-white/[0.06] transition-colors">
                                İptal
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function StaffRequestsPage() {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>('PENDING');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [approveModalReq, setApproveModalReq] = useState<ApprovalRequestResponse | null>(null);

    const { data: allRequests, isLoading } = useQuery<ApprovalRequestResponse[]>({
        queryKey: ['approval-requests'],
        queryFn: () => staffApi.getApprovalRequests(),
    });

    const { data: staffMembers } = useQuery({
        queryKey: ['assignable-staff-list'],
        queryFn: () => staffApi.getAssignableUsers(),
        retry: false,
    });

    const approveMut = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => staffApi.approveRequest(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['approval-requests'] });
            qc.invalidateQueries({ queryKey: ['pending-approval-count'] });
            setApproveModalReq(null);
        },
    });

    const rejectMut = useMutation({
        mutationFn: ({ id, note }: { id: string; note?: string }) => staffApi.rejectRequest(id, note),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['approval-requests'] });
            qc.invalidateQueries({ queryKey: ['pending-approval-count'] });
        },
    });

    const requests = (allRequests ?? []).filter(r =>
        activeTab === 'PENDING' ? r.status === 'PENDING' : true
    );

    const pendingCount = (allRequests ?? []).filter(r => r.status === 'PENDING').length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">İstekler</h1>
                <p className="text-sm text-zinc-500 mt-1">Şirketlerden gelen onay bekleyen talepler</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('PENDING')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                        activeTab === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-transparent text-zinc-500 border-white/[0.06] hover:border-white/[0.12] hover:text-zinc-300'
                    }`}
                >
                    <Clock className="w-3.5 h-3.5" />
                    Bekleyen
                    {pendingCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20">
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('ALL')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                        activeTab === 'ALL'
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                            : 'bg-transparent text-zinc-500 border-white/[0.06] hover:border-white/[0.12] hover:text-zinc-300'
                    }`}
                >
                    <Inbox className="w-3.5 h-3.5" />
                    Tümü
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <Inbox className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">
                        {activeTab === 'PENDING' ? 'Bekleyen istek yok' : 'Henüz istek yok'}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">Şirketlerden gelen talepler burada görünecek.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(req => {
                        const typeInfo = TYPE_CONFIG[req.type] ?? TYPE_CONFIG.GENERAL;
                        const statusInfo = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING;
                        const TypeIcon = typeInfo.icon;
                        const isExpanded = expandedId === req.id;
                        const meta = parseMetadata(req.metadata);

                        return (
                            <div key={req.id}
                                className="bg-[#0C0C0E] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.10] transition-all"
                            >
                                {/* Card header */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                                    className="w-full text-left p-4 flex items-start gap-4"
                                >
                                    <div className={`h-10 w-10 rounded-xl ${typeInfo.bg} flex items-center justify-center shrink-0`}>
                                        <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-white truncate">{req.title}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.cls}`}>
                                                {statusInfo.label}
                                            </span>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${typeInfo.bg} ${typeInfo.color}`}>
                                                {typeInfo.label}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-4 flex-wrap">
                                            <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                                                <Building2 className="w-3 h-3" />
                                                {req.companyName}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                                                <User className="w-3 h-3" />
                                                {req.requestedByName}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(req.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-1 border-t border-white/[0.04]">
                                        {req.description && (
                                            <p className="text-sm text-zinc-400 mt-2 mb-3">{req.description}</p>
                                        )}

                                        {/* Metadata details */}
                                        {req.type === 'CONTENT_APPROVAL' && req.metadata && (
                                            <div className="bg-white/[0.02] rounded-xl p-4 mb-3 space-y-2">
                                                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Müşteriden Gelen Çekim Bilgileri</p>
                                                {meta.shootTitle && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Camera className="w-3.5 h-3.5 text-zinc-500" />
                                                        <span className="text-zinc-400">Başlık:</span>
                                                        <span className="text-white">{meta.shootTitle}</span>
                                                    </div>
                                                )}
                                                {meta.shootDate && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                                                        <span className="text-zinc-400">Tarih:</span>
                                                        <span className="text-white">{new Date(meta.shootDate).toLocaleDateString('tr-TR')}</span>
                                                        {meta.shootTime && <span className="text-zinc-500">· {meta.shootTime}</span>}
                                                    </div>
                                                )}
                                                {meta.location && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                                                        <span className="text-zinc-400">Konum:</span>
                                                        <span className="text-white">{meta.location}</span>
                                                    </div>
                                                )}
                                                {meta.shootDescription && (
                                                    <p className="text-xs text-zinc-500 mt-1">{meta.shootDescription}</p>
                                                )}
                                                {meta.existingShootId && (
                                                    <p className="text-xs text-emerald-400">Mevcut çekime bağlanacak</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Review info */}
                                        {req.reviewedByName && (
                                            <div className="bg-white/[0.02] rounded-xl p-3 mb-3 text-xs text-zinc-500">
                                                <span className="font-medium text-zinc-300">{req.reviewedByName}</span> tarafından {req.status === 'APPROVED' ? 'onaylandı' : 'reddedildi'}
                                                {req.reviewedAt && <> · {formatDate(req.reviewedAt)}</>}
                                                {req.reviewNote && <p className="mt-1 text-zinc-400">{req.reviewNote}</p>}
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        {req.status === 'PENDING' && (
                                            <div className="flex items-center gap-2 mt-3">
                                                <button
                                                    onClick={() => setApproveModalReq(req)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Onayla
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const note = prompt('Red sebebi (opsiyonel):');
                                                        rejectMut.mutate({ id: req.id, note: note || undefined });
                                                    }}
                                                    disabled={rejectMut.isPending}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Reddet
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Approve Modal */}
            {approveModalReq && (
                <ApproveModal
                    req={approveModalReq}
                    staffMembers={staffMembers ?? []}
                    onClose={() => setApproveModalReq(null)}
                    onApprove={(data) => approveMut.mutate({ id: approveModalReq.id, data })}
                    isLoading={approveMut.isPending}
                />
            )}
        </div>
    );
}
