import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import type { ShootResponse, PageResponse } from '../../api/staff';
import { Camera, MapPin, Calendar, Clock, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CompanyResponse as AdminCompanyResponse } from '../../api/admin';

export default function ShootsPage() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ companyId: '', title: '', description: '', shootDate: '', shootTime: '', location: '' });

    const { data, isLoading } = useQuery<PageResponse<ShootResponse>>({
        queryKey: ['shoots'],
        queryFn: () => staffApi.getShoots(0, 50),
    });

    const { data: companies } = useQuery<AdminCompanyResponse[]>({
        queryKey: ['staff-companies'],
        queryFn: () => staffApi.getCompanies(),
    });

    const createMutation = useMutation({
        mutationFn: () => staffApi.createShoot({
            companyId: form.companyId,
            title: form.title,
            description: form.description || undefined,
            shootDate: form.shootDate ? new Date(form.shootDate).toISOString() : undefined,
            shootTime: form.shootTime || undefined,
            location: form.location || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shoots'] });
            setShowCreate(false);
            setForm({ companyId: '', title: '', description: '', shootDate: '', shootTime: '', location: '' });
        },
    });

    const shoots = data?.content || [];

    const statusLabel: Record<string, string> = { PLANNED: 'PLANLANDI', COMPLETED: 'TAMAMLANDI', CANCELLED: 'İPTAL' };

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
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <Camera className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">Henüz çekim planlanmamış</h3>
                    <p className="text-sm text-zinc-500 mt-1">Yeni çekim eklemek için butona tıklayın</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {shoots.map((s, i) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 group hover:border-violet-500/20 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                                    <Camera className="w-6 h-6" />
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${s.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : s.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 'bg-violet-500/10 text-violet-400'}`}>
                                    {statusLabel[s.status] || s.status}
                                </span>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{s.title}</h3>
                                <p className="text-zinc-500 text-sm mt-1">{s.companyName}</p>
                                {s.description && <p className="text-zinc-600 text-xs mt-2 line-clamp-2">{s.description}</p>}
                            </div>

                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {s.shootDate && (
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <Calendar className="w-4 h-4 text-zinc-600" />
                                        <span className="text-xs">{new Date(s.shootDate).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                )}
                                {s.shootTime && (
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <Clock className="w-4 h-4 text-zinc-600" />
                                        <span className="text-xs">{s.shootTime}</span>
                                    </div>
                                )}
                                {s.location && (
                                    <div className="flex items-center gap-3 text-zinc-400 col-span-2">
                                        <MapPin className="w-4 h-4 text-zinc-600" />
                                        <span className="text-xs truncate">{s.location}</span>
                                    </div>
                                )}
                            </div>

                            {s.participants.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-1">
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

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Yeni Çekim Planla</h2>
                                <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))} className="w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white">
                                <option value="">Şirket seçin</option>
                                {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input placeholder="Çekim başlığı" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white" />
                            <textarea placeholder="Açıklama (opsiyonel)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white resize-none" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input type="date" value={form.shootDate} onChange={e => setForm(f => ({ ...f, shootDate: e.target.value }))} className="bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white" />
                                <input type="time" value={form.shootTime} onChange={e => setForm(f => ({ ...f, shootTime: e.target.value }))} className="bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white" />
                            </div>
                            <input placeholder="Konum" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white" />
                            <button disabled={!form.companyId || !form.title || createMutation.isPending} onClick={() => createMutation.mutate()} className="w-full py-2.5 bg-violet-500 text-white rounded-xl text-sm font-bold hover:bg-violet-600 disabled:opacity-50 transition-colors">
                                {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
