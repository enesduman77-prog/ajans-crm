import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import type { PrProjectResponse, PageResponse } from '../../api/staff';
import type { CompanyResponse } from '../../api/admin';
import { Rocket, Clock, CheckCircle2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PRProjectsPage() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ companyId: '', name: '', purpose: '', phaseNames: ['Faz 1', 'Faz 2', 'Faz 3'] });

    const { data, isLoading } = useQuery<PageResponse<PrProjectResponse>>({
        queryKey: ['pr-projects'],
        queryFn: () => staffApi.getPrProjects(0, 50),
    });

    const { data: companies } = useQuery<CompanyResponse[]>({
        queryKey: ['staff-companies'],
        queryFn: () => staffApi.getCompanies(),
    });

    const createMutation = useMutation({
        mutationFn: () => staffApi.createPrProject({
            companyId: form.companyId,
            name: form.name,
            purpose: form.purpose || undefined,
            phaseNames: form.phaseNames.filter(n => n.trim()),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pr-projects'] });
            setShowCreate(false);
            setForm({ companyId: '', name: '', purpose: '', phaseNames: ['Faz 1', 'Faz 2', 'Faz 3'] });
        },
    });

    const completePhaseMutation = useMutation({
        mutationFn: ({ projectId, phaseId }: { projectId: string; phaseId: string }) =>
            staffApi.completePrPhase(projectId, phaseId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pr-projects'] }),
    });

    const projects = data?.content || [];

    const statusLabel: Record<string, string> = { ACTIVE: 'DEVAM EDİYOR', COMPLETED: 'TAMAMLANDI', PAUSED: 'DURDURULDU' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">PR Projeleri</h1>
                    <p className="text-zinc-600 text-sm mt-1">Aktif PR kampanyaları ve aşamaları</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
                    <Plus className="w-4 h-4" /> Yeni Proje
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin h-8 w-8 border-2 border-orange-400 border-t-transparent rounded-full" />
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <Rocket className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">Henüz PR projesi yok</h3>
                    <p className="text-sm text-zinc-500 mt-1">Yeni proje eklemek için butona tıklayın</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <Rocket className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">{p.name}</h3>
                                        <p className="text-zinc-500 text-xs">{p.companyName}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${p.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'PAUSED' ? 'bg-zinc-500/10 text-zinc-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                    {statusLabel[p.status] || p.status}
                                </span>
                            </div>

                            {p.purpose && <p className="text-zinc-600 text-xs mt-3 line-clamp-2">{p.purpose}</p>}

                            <div className="mt-6 space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                    <span>İlerleme {Number(p.progressPercent).toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${p.progressPercent}%` }}
                                        className={`h-full ${p.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                                {p.phases.map(phase => (
                                    <button
                                        key={phase.id}
                                        onClick={() => {
                                            if (!phase.isCompleted && p.status !== 'COMPLETED') {
                                                completePhaseMutation.mutate({ projectId: p.id, phaseId: phase.id });
                                            }
                                        }}
                                        disabled={phase.isCompleted || p.status === 'COMPLETED'}
                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${phase.isCompleted
                                            ? 'bg-white/5 border-white/[0.08]'
                                            : 'bg-transparent border-white/[0.06] hover:border-orange-500/30 cursor-pointer'
                                            } disabled:cursor-default`}
                                    >
                                        {phase.isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-zinc-700" />}
                                        <span className="text-[10px] text-zinc-500 font-medium truncate">{phase.name}</span>
                                    </button>
                                ))}
                            </div>

                            {p.members.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-1">
                                    {p.members.map(m => (
                                        <span key={m.userId} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-zinc-400">{m.fullName}</span>
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
                                <h2 className="text-lg font-bold text-white">Yeni PR Projesi</h2>
                                <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))} className="w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white">
                                <option value="">Şirket seçin</option>
                                {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input placeholder="Proje adı" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white" />
                            <textarea placeholder="Amaç / açıklama (opsiyonel)" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} rows={2} className="w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white resize-none" />
                            <div className="space-y-2">
                                <label className="text-xs text-zinc-500">Faz isimleri</label>
                                {form.phaseNames.map((name, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input value={name} onChange={e => { const n = [...form.phaseNames]; n[idx] = e.target.value; setForm(f => ({ ...f, phaseNames: n })); }}
                                            className="flex-1 bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white" />
                                        {form.phaseNames.length > 1 && (
                                            <button onClick={() => setForm(f => ({ ...f, phaseNames: f.phaseNames.filter((_, i) => i !== idx) }))} className="text-zinc-600 hover:text-red-400"><X className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={() => setForm(f => ({ ...f, phaseNames: [...f.phaseNames, `Faz ${f.phaseNames.length + 1}`] }))} className="text-xs text-orange-400 hover:text-orange-300">+ Faz ekle</button>
                            </div>
                            <button disabled={!form.companyId || !form.name || createMutation.isPending} onClick={() => createMutation.mutate()} className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors">
                                {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
