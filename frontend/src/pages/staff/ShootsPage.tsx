import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import type { ShootResponse, PageResponse, AssignableUser } from '../../api/staff';
import { Camera, MapPin, Calendar, Clock, Plus, X, User, Wrench, Package, FileText, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CompanyResponse as AdminCompanyResponse } from '../../api/admin';

interface EquipmentForm { name: string; quantity: number; notes: string }

const inputCls = 'w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none';

const STATUS_LABEL: Record<string, string> = { PLANNED: 'PLANLANDI', COMPLETED: 'TAMAMLANDI', CANCELLED: 'İPTAL' };
const STATUS_STYLE: Record<string, string> = {
    PLANNED: 'bg-violet-500/10 text-violet-400',
    COMPLETED: 'bg-pink-500/10 text-pink-400',
    CANCELLED: 'bg-red-500/10 text-red-400',
};

export default function ShootsPage() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [selected, setSelected] = useState<ShootResponse | null>(null);
    const [form, setForm] = useState({
        companyId: '', title: '', description: '', shootDate: '', shootTime: '',
        location: '', photographerId: '', notes: '',
        equipment: [{ name: '', quantity: 1, notes: '' }] as EquipmentForm[],
    });

    const { data, isLoading } = useQuery<PageResponse<ShootResponse>>({
        queryKey: ['shoots'],
        queryFn: () => staffApi.getShoots(0, 50),
    });

    const { data: companies } = useQuery<AdminCompanyResponse[]>({
        queryKey: ['staff-companies'],
        queryFn: () => staffApi.getCompanies(),
    });

    const { data: users } = useQuery<AssignableUser[]>({
        queryKey: ['assignable-users'],
        queryFn: () => staffApi.getAssignableUsers(),
    });

    const createMutation = useMutation({
        mutationFn: () => staffApi.createShoot({
            companyId: form.companyId,
            title: form.title,
            description: form.description || undefined,
            shootDate: form.shootDate ? new Date(form.shootDate).toISOString() : undefined,
            shootTime: form.shootTime || undefined,
            location: form.location || undefined,
            photographerId: form.photographerId || undefined,
            notes: form.notes || undefined,
            equipment: form.equipment.filter(e => e.name.trim()).map(e => ({
                name: e.name, quantity: e.quantity || 1, notes: e.notes || undefined,
            })),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shoots'] });
            setShowCreate(false);
            resetForm();
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => staffApi.updateShootStatus(id, status),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['shoots'] });
            setSelected(data);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => staffApi.deleteShoot(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shoots'] });
            setSelected(null);
        },
    });

    const resetForm = () => setForm({
        companyId: '', title: '', description: '', shootDate: '', shootTime: '',
        location: '', photographerId: '', notes: '',
        equipment: [{ name: '', quantity: 1, notes: '' }],
    });

    const shoots = data?.content || [];

    const formatDate = (d: string | null) => {
        if (!d) return null;
        try { return new Date(d).toLocaleDateString('tr-TR'); } catch { return null; }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Çekim Takvimi</h1>
                    <p className="text-zinc-600 text-sm mt-1">Planlanan fotoğraf ve video çekimleri</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600 transition-colors">
                    <Plus className="w-4 h-4" /> Yeni Çekim
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin h-8 w-8 border-2 border-violet-400 border-t-transparent rounded-full" />
                </div>
            ) : shoots.length === 0 ? (
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <Camera className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">Henüz çekim planlanmamış</h3>
                    <p className="text-sm text-zinc-500 mt-1">Yeni çekim eklemek için butona tıklayın</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {shoots.map((s, i) => (
                        <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            onClick={() => setSelected(s)}
                            className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6 group hover:border-violet-500/20 transition-all cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                                    <Camera className="w-6 h-6" />
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[s.status] || STATUS_STYLE.PLANNED}`}>
                                    {STATUS_LABEL[s.status] || s.status}
                                </span>
                            </div>

                            <div className="mt-4">
                                <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{s.title}</h3>
                                <p className="text-zinc-500 text-sm mt-0.5">{s.companyName}</p>
                                {s.description && <p className="text-zinc-600 text-xs mt-2 line-clamp-2">{s.description}</p>}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {s.shootDate && (
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                                        <span className="text-xs">{formatDate(s.shootDate)}</span>
                                    </div>
                                )}
                                {s.shootTime && (
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Clock className="w-3.5 h-3.5 text-zinc-600" />
                                        <span className="text-xs">{s.shootTime}</span>
                                    </div>
                                )}
                                {s.location && (
                                    <div className="flex items-center gap-2 text-zinc-400 col-span-2">
                                        <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                                        <span className="text-xs truncate">{s.location}</span>
                                    </div>
                                )}
                                {s.photographerName && (
                                    <div className="flex items-center gap-2 text-zinc-400 col-span-2">
                                        <User className="w-3.5 h-3.5 text-violet-500" />
                                        <span className="text-xs">Çekimci: <span className="text-violet-400">{s.photographerName}</span></span>
                                    </div>
                                )}
                            </div>

                            {/* Equipment chips */}
                            {s.equipment && s.equipment.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {s.equipment.map(eq => (
                                        <span key={eq.id} className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/5 border border-violet-500/10 rounded text-[10px] text-violet-300">
                                            <Wrench className="w-2.5 h-2.5" />
                                            {eq.name}{eq.quantity > 1 ? ` x${eq.quantity}` : ''}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {s.participants.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {s.participants.map(p => (
                                        <span key={p.userId} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-zinc-400">
                                            {p.fullName}{p.roleInShoot ? ` (${p.roleInShoot})` : ''}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Detail Panel */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelected(null)}>
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="w-full max-w-xl bg-[#0c0c0e] border-l border-white/[0.06] h-full overflow-y-auto"
                            onClick={e => e.stopPropagation()}>

                            <div className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm border-b border-white/[0.06] p-5 z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-violet-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white">{selected.title}</h2>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLE[selected.status]}`}>
                                                {STATUS_LABEL[selected.status]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { if (confirm('Bu çekimi silmek istediğinize emin misiniz?')) deleteMutation.mutate(selected.id); }}
                                            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <InfoCard icon={<User className="w-4 h-4" />} label="Şirket" value={selected.companyName} />
                                    {selected.photographerName && <InfoCard icon={<Camera className="w-4 h-4" />} label="Çekimci" value={selected.photographerName} />}
                                    {selected.shootDate && <InfoCard icon={<Calendar className="w-4 h-4" />} label="Tarih" value={formatDate(selected.shootDate) || '-'} />}
                                    {selected.shootTime && <InfoCard icon={<Clock className="w-4 h-4" />} label="Saat" value={selected.shootTime} />}
                                    {selected.location && <InfoCard icon={<MapPin className="w-4 h-4" />} label="Konum" value={selected.location} />}
                                </div>

                                {selected.description && (
                                    <div className="bg-[#0C0C0E] rounded-xl p-3 border border-white/[0.04]">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Açıklama</p>
                                        <p className="text-sm text-zinc-300">{selected.description}</p>
                                    </div>
                                )}

                                {selected.notes && (
                                    <div className="bg-[#0C0C0E] rounded-xl p-3 border border-white/[0.04]">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Notlar</p>
                                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{selected.notes}</p>
                                    </div>
                                )}

                                {/* Equipment */}
                                {selected.equipment && selected.equipment.length > 0 && (
                                    <div className="border-t border-white/[0.06] pt-5">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <Package className="w-3.5 h-3.5" /> Ekipman
                                        </p>
                                        <div className="space-y-2">
                                            {selected.equipment.map(eq => (
                                                <div key={eq.id} className="bg-[#0C0C0E] rounded-xl p-3 border border-white/[0.04] flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                                            <Wrench className="w-4 h-4 text-violet-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-white font-medium">{eq.name}</p>
                                                            {eq.notes && <p className="text-[10px] text-zinc-600">{eq.notes}</p>}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-zinc-500 font-mono">x{eq.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Participants */}
                                {selected.participants.length > 0 && (
                                    <div className="border-t border-white/[0.06] pt-5">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Katılımcılar</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selected.participants.map(p => (
                                                <span key={p.userId} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C0C0E] border border-white/[0.04] rounded-lg text-xs text-zinc-300">
                                                    <div className="h-5 w-5 rounded-full bg-violet-500/10 flex items-center justify-center text-[10px] font-bold text-violet-400">
                                                        {p.fullName.charAt(0)}
                                                    </div>
                                                    {p.fullName}{p.roleInShoot ? ` — ${p.roleInShoot}` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Status Actions */}
                                {selected.status === 'PLANNED' && (
                                    <div className="border-t border-white/[0.06] pt-5 flex gap-2">
                                        <button onClick={() => statusMutation.mutate({ id: selected.id, status: 'COMPLETED' })}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-pink-500/10 text-pink-400 rounded-xl text-xs font-medium hover:bg-pink-500/20 transition-colors">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Tamamlandı
                                        </button>
                                        <button onClick={() => statusMutation.mutate({ id: selected.id, status: 'CANCELLED' })}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-medium hover:bg-red-500/20 transition-colors">
                                            <XCircle className="w-3.5 h-3.5" /> İptal Et
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0C0C0E] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg space-y-4 mb-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Yeni Çekim Planla</h2>
                                <button onClick={() => { setShowCreate(false); resetForm(); }} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>

                            <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))} className={inputCls}>
                                <option value="">Şirket seçin *</option>
                                {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <input placeholder="Çekim başlığı *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />

                            {/* Çekimci */}
                            <div>
                                <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1 block">Çekimci (Çekecek Kişi)</label>
                                <select value={form.photographerId} onChange={e => setForm(f => ({ ...f, photographerId: e.target.value }))} className={inputCls}>
                                    <option value="">Kişi seçin (opsiyonel)</option>
                                    {users?.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                                </select>
                            </div>

                            <textarea placeholder="Açıklama (opsiyonel)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1 block">Tarih</label>
                                    <input type="date" value={form.shootDate} onChange={e => setForm(f => ({ ...f, shootDate: e.target.value }))} className={inputCls} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1 block">Saat</label>
                                    <input type="time" value={form.shootTime} onChange={e => setForm(f => ({ ...f, shootTime: e.target.value }))} className={inputCls} />
                                </div>
                            </div>

                            <input placeholder="Konum" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} />

                            <textarea placeholder="Notlar (opsiyonel)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />

                            {/* Ekipman */}
                            <div className="space-y-3 border-t border-white/[0.06] pt-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5" /> Ekipman Listesi
                                    </label>
                                    <button onClick={() => setForm(f => ({ ...f, equipment: [...f.equipment, { name: '', quantity: 1, notes: '' }] }))}
                                        className="text-xs text-violet-400 hover:text-violet-300">+ Ekipman ekle</button>
                                </div>
                                {form.equipment.map((eq, idx) => (
                                    <div key={idx} className="bg-[#18181b]/50 rounded-xl border border-white/[0.06] p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input placeholder="Ekipman adı" value={eq.name}
                                                onChange={e => { const list = [...form.equipment]; list[idx] = { ...list[idx], name: e.target.value }; setForm(f => ({ ...f, equipment: list })); }}
                                                className="flex-1 bg-[#0C0C0E] border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-white" />
                                            <input type="number" min={1} value={eq.quantity} placeholder="Adet"
                                                onChange={e => { const list = [...form.equipment]; list[idx] = { ...list[idx], quantity: parseInt(e.target.value) || 1 }; setForm(f => ({ ...f, equipment: list })); }}
                                                className="w-16 bg-[#0C0C0E] border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-white text-center" />
                                            {form.equipment.length > 1 && (
                                                <button onClick={() => setForm(f => ({ ...f, equipment: f.equipment.filter((_, i) => i !== idx) }))}
                                                    className="text-zinc-600 hover:text-red-400"><X className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                        <input placeholder="Ekipman notu (opsiyonel)" value={eq.notes}
                                            onChange={e => { const list = [...form.equipment]; list[idx] = { ...list[idx], notes: e.target.value }; setForm(f => ({ ...f, equipment: list })); }}
                                            className="w-full bg-[#0C0C0E] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white" />
                                    </div>
                                ))}
                            </div>

                            <button disabled={!form.companyId || !form.title || createMutation.isPending} onClick={() => createMutation.mutate()}
                                className="w-full py-2.5 bg-violet-500 text-white rounded-xl text-sm font-bold hover:bg-violet-600 disabled:opacity-50 transition-colors">
                                {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-[#0C0C0E] rounded-xl p-3 border border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-zinc-600 mb-1">{icon}<span className="text-[10px] font-bold uppercase tracking-widest">{label}</span></div>
            <p className="text-sm text-white font-medium truncate">{value}</p>
        </div>
    );
}
