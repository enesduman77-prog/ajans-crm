import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import type { PrProjectResponse, PrPhaseInfo, AssignableUser, PageResponse, CreatePrProjectRequest } from '../../api/staff';
import type { CompanyResponse } from '../../api/admin';
import { Rocket, Clock, CheckCircle2, Plus, X, ChevronDown, ChevronUp, User, Building2, Calendar, FileText, Trash2, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhaseForm {
    name: string;
    assignedToId: string;
    startDate: string;
    endDate: string;
    notes: string;
}

const emptyPhase = (n: number): PhaseForm => ({ name: `Faz ${n}`, assignedToId: '', startDate: '', endDate: '', notes: '' });

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'DEVAM EDİYOR', COMPLETED: 'TAMAMLANDI', PAUSED: 'DURDURULDU' };
const STATUS_STYLE: Record<string, string> = {
    ACTIVE: 'bg-orange-500/10 text-orange-400',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400',
    PAUSED: 'bg-zinc-500/10 text-zinc-400',
};

const inputCls = 'w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none';
const selectCls = inputCls;

export default function PRProjectsPage() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [selectedProject, setSelectedProject] = useState<PrProjectResponse | null>(null);
    const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '', companyId: '', responsibleId: '', purpose: '', startDate: '', endDate: '', notes: '',
        phases: [emptyPhase(1), emptyPhase(2), emptyPhase(3)] as PhaseForm[],
    });

    const { data, isLoading } = useQuery<PageResponse<PrProjectResponse>>({
        queryKey: ['pr-projects'],
        queryFn: () => staffApi.getPrProjects(0, 50),
    });

    const { data: companies } = useQuery<CompanyResponse[]>({
        queryKey: ['staff-companies'],
        queryFn: () => staffApi.getCompanies(),
    });

    const { data: users } = useQuery<AssignableUser[]>({
        queryKey: ['assignable-users'],
        queryFn: () => staffApi.getAssignableUsers(),
    });

    const createMutation = useMutation({
        mutationFn: () => {
            const req: CreatePrProjectRequest = {
                name: form.name,
                companyId: form.companyId || undefined,
                responsibleId: form.responsibleId || undefined,
                purpose: form.purpose || undefined,
                startDate: form.startDate || undefined,
                endDate: form.endDate || undefined,
                notes: form.notes || undefined,
                phases: form.phases.filter(p => p.name.trim()).map(p => ({
                    name: p.name,
                    assignedToId: p.assignedToId || undefined,
                    startDate: p.startDate || undefined,
                    endDate: p.endDate || undefined,
                    notes: p.notes || undefined,
                })),
            };
            return staffApi.createPrProject(req);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pr-projects'] });
            setShowCreate(false);
            resetForm();
        },
    });

    const completePhaseMutation = useMutation({
        mutationFn: ({ projectId, phaseId }: { projectId: string; phaseId: string }) =>
            staffApi.completePrPhase(projectId, phaseId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['pr-projects'] });
            setSelectedProject(data);
        },
    });

    const addPhaseNoteMutation = useMutation({
        mutationFn: ({ projectId, phaseId, content }: { projectId: string; phaseId: string; content: string }) =>
            staffApi.addPrPhaseNote(projectId, phaseId, content),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['pr-projects'] });
            setSelectedProject(data);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => staffApi.deletePrProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pr-projects'] });
            setSelectedProject(null);
        },
    });

    const resetForm = () => setForm({ name: '', companyId: '', responsibleId: '', purpose: '', startDate: '', endDate: '', notes: '', phases: [emptyPhase(1), emptyPhase(2), emptyPhase(3)] });

    const projects = data?.content || [];

    const formatDate = (d: string | null) => {
        if (!d) return null;
        try { return new Date(d).toLocaleDateString('tr-TR'); } catch { return null; }
    };

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
                        <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedProject(p)}
                            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 cursor-pointer hover:border-orange-500/20 transition-colors group">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <Rocket className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">{p.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {p.companyName && <span className="text-zinc-500 text-xs">{p.companyName}</span>}
                                            {p.responsibleName && (
                                                <span className="text-zinc-600 text-xs flex items-center gap-1">
                                                    <User className="w-3 h-3" />{p.responsibleName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLE[p.status] || STATUS_STYLE.ACTIVE}`}>
                                    {STATUS_LABEL[p.status] || p.status}
                                </span>
                            </div>

                            {p.purpose && <p className="text-zinc-600 text-xs mt-3 line-clamp-2">{p.purpose}</p>}

                            {(p.startDate || p.endDate) && (
                                <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-600">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(p.startDate)} — {formatDate(p.endDate) || '?'}
                                </div>
                            )}

                            <div className="mt-4 space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                    <span>İlerleme {Number(p.progressPercent).toFixed(0)}%</span>
                                    <span>{p.phases.filter(ph => ph.isCompleted).length}/{p.phases.length} faz</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.progressPercent}%` }}
                                        className={`h-full ${p.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {p.phases.map(phase => (
                                    <span key={phase.id} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${phase.isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#18181b] text-zinc-500'}`}>
                                        {phase.isCompleted ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                        {phase.name}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ─── Project Detail Panel ─── */}
            <AnimatePresence>
                {selectedProject && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => { setSelectedProject(null); setExpandedPhase(null); }}>
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="w-full max-w-xl bg-[#0c0c0e] border-l border-white/[0.06] h-full overflow-y-auto"
                            onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm border-b border-white/[0.06] p-5 z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                            <Rocket className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white">{selectedProject.name}</h2>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLE[selectedProject.status]}`}>
                                                {STATUS_LABEL[selectedProject.status]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { if (confirm('Bu projeyi silmek istediğinize emin misiniz?')) deleteMutation.mutate(selectedProject.id); }}
                                            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setSelectedProject(null); setExpandedPhase(null); }}
                                            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedProject.responsibleName && (
                                        <InfoCard icon={<User className="w-4 h-4" />} label="Sorumlu" value={selectedProject.responsibleName} />
                                    )}
                                    {selectedProject.companyName && (
                                        <InfoCard icon={<Building2 className="w-4 h-4" />} label="Şirket" value={selectedProject.companyName} />
                                    )}
                                    {selectedProject.startDate && (
                                        <InfoCard icon={<Calendar className="w-4 h-4" />} label="Başlangıç" value={formatDate(selectedProject.startDate) || '-'} />
                                    )}
                                    {selectedProject.endDate && (
                                        <InfoCard icon={<Calendar className="w-4 h-4" />} label="Bitiş" value={formatDate(selectedProject.endDate) || '-'} />
                                    )}
                                </div>

                                {selectedProject.purpose && (
                                    <div className="bg-[#111113] rounded-xl p-3 border border-white/[0.04]">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Amaç</p>
                                        <p className="text-sm text-zinc-300">{selectedProject.purpose}</p>
                                    </div>
                                )}

                                {selectedProject.notes && (
                                    <div className="bg-[#111113] rounded-xl p-3 border border-white/[0.04]">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Notlar</p>
                                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{selectedProject.notes}</p>
                                    </div>
                                )}

                                {/* Progress */}
                                <div>
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                                        <span>İlerleme {Number(selectedProject.progressPercent).toFixed(0)}%</span>
                                        <span>{selectedProject.phases.filter(ph => ph.isCompleted).length}/{selectedProject.phases.length}</span>
                                    </div>
                                    <div className="h-2 w-full bg-[#18181b] rounded-full overflow-hidden">
                                        <div className={`h-full transition-all ${selectedProject.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                            style={{ width: `${selectedProject.progressPercent}%` }} />
                                    </div>
                                </div>

                                {/* Phases */}
                                <div className="border-t border-white/[0.06] pt-5">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Fazlar</p>
                                    <div className="space-y-2">
                                        {selectedProject.phases.map(phase => (
                                            <PhaseCard key={phase.id} phase={phase} project={selectedProject}
                                                expanded={expandedPhase === phase.id}
                                                onToggle={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                                                onComplete={() => completePhaseMutation.mutate({ projectId: selectedProject.id, phaseId: phase.id })}
                                                onAddNote={(content) => addPhaseNoteMutation.mutate({ projectId: selectedProject.id, phaseId: phase.id, content })}
                                                formatDate={formatDate} />
                                        ))}
                                    </div>
                                </div>

                                {/* Members */}
                                {selectedProject.members.length > 0 && (
                                    <div className="border-t border-white/[0.06] pt-5">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Ekip</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProject.members.map(m => (
                                                <span key={m.userId} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111113] border border-white/[0.04] rounded-lg text-xs text-zinc-300">
                                                    <div className="h-5 w-5 rounded-full bg-orange-500/10 flex items-center justify-center text-[10px] font-bold text-orange-400">
                                                        {m.fullName.charAt(0)}
                                                    </div>
                                                    {m.fullName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Create Modal ─── */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg space-y-4 mb-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Yeni PR Projesi</h2>
                                <button onClick={() => { setShowCreate(false); resetForm(); }} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>

                            {/* Proje Başlığı */}
                            <input placeholder="Proje adı *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />

                            {/* Sorumlu Kişi */}
                            <div>
                                <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1 block">Sorumlu Kişi</label>
                                <select value={form.responsibleId} onChange={e => setForm(f => ({ ...f, responsibleId: e.target.value }))} className={selectCls}>
                                    <option value="">Kişi seçin (opsiyonel)</option>
                                    {users?.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                                </select>
                            </div>

                            {/* Şirket */}
                            <div>
                                <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1 block">Şirket (Opsiyonel)</label>
                                <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))} className={selectCls}>
                                    <option value="">Şirket seçin</option>
                                    {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Genel Tarihler */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1 block">Başlangıç</label>
                                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1 block">Bitiş</label>
                                    <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
                                </div>
                            </div>

                            {/* Amaç */}
                            <textarea placeholder="Amaç / açıklama (opsiyonel)" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />

                            {/* Not */}
                            <textarea placeholder="Notlar (opsiyonel)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />

                            {/* Fazlar */}
                            <div className="space-y-3 border-t border-white/[0.06] pt-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Fazlar</label>
                                    <button onClick={() => setForm(f => ({ ...f, phases: [...f.phases, emptyPhase(f.phases.length + 1)] }))} className="text-xs text-orange-400 hover:text-orange-300">+ Faz ekle</button>
                                </div>
                                {form.phases.map((phase, idx) => (
                                    <div key={idx} className="bg-[#18181b]/50 rounded-xl border border-white/[0.06] p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-orange-400 shrink-0">Faz {idx + 1}</span>
                                            <input placeholder="Faz adı" value={phase.name}
                                                onChange={e => { const p = [...form.phases]; p[idx] = { ...p[idx], name: e.target.value }; setForm(f => ({ ...f, phases: p })); }}
                                                className="flex-1 bg-[#111113] border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-white" />
                                            {form.phases.length > 1 && (
                                                <button onClick={() => setForm(f => ({ ...f, phases: f.phases.filter((_, i) => i !== idx) }))} className="text-zinc-600 hover:text-red-400"><X className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                        <select value={phase.assignedToId}
                                            onChange={e => { const p = [...form.phases]; p[idx] = { ...p[idx], assignedToId: e.target.value }; setForm(f => ({ ...f, phases: p })); }}
                                            className="w-full bg-[#111113] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white">
                                            <option value="">Atanan kişi (opsiyonel)</option>
                                            {users?.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                                        </select>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="date" value={phase.startDate} placeholder="Başlangıç"
                                                onChange={e => { const p = [...form.phases]; p[idx] = { ...p[idx], startDate: e.target.value }; setForm(f => ({ ...f, phases: p })); }}
                                                className="bg-[#111113] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white" />
                                            <input type="date" value={phase.endDate} placeholder="Bitiş"
                                                onChange={e => { const p = [...form.phases]; p[idx] = { ...p[idx], endDate: e.target.value }; setForm(f => ({ ...f, phases: p })); }}
                                                className="bg-[#111113] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white" />
                                        </div>
                                        <textarea placeholder="Faz notu (opsiyonel)" value={phase.notes} rows={1}
                                            onChange={e => { const p = [...form.phases]; p[idx] = { ...p[idx], notes: e.target.value }; setForm(f => ({ ...f, phases: p })); }}
                                            className="w-full bg-[#111113] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white resize-none" />
                                    </div>
                                ))}
                            </div>

                            <button disabled={!form.name || createMutation.isPending} onClick={() => createMutation.mutate()}
                                className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors">
                                {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Helper Components ─── */

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-[#111113] rounded-xl p-3 border border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-zinc-600 mb-1">{icon}<span className="text-[10px] font-bold uppercase tracking-widest">{label}</span></div>
            <p className="text-sm text-white font-medium truncate">{value}</p>
        </div>
    );
}

function PhaseCard({ phase, project, expanded, onToggle, onComplete, onAddNote, formatDate }: {
    phase: PrPhaseInfo; project: PrProjectResponse; expanded: boolean;
    onToggle: () => void; onComplete: () => void; onAddNote: (content: string) => void; formatDate: (d: string | null) => string | null;
}) {
    const [noteText, setNoteText] = useState('');
    const formatNoteDate = (d: string) => {
        try { const dt = new Date(d); return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) + ' ' + dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
        catch { return d; }
    };
    return (
        <div className={`bg-[#111113] border rounded-xl transition-colors ${phase.isCompleted ? 'border-emerald-500/10' : 'border-white/[0.04]'}`}>
            <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={onToggle}>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold ${phase.isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#18181b] text-zinc-500'}`}>
                    {phase.phaseNumber}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${phase.isCompleted ? 'text-emerald-400' : 'text-white'}`}>{phase.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {phase.assignedToName && <span className="text-[10px] text-zinc-600 flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{phase.assignedToName}</span>}
                        {(phase.startDate || phase.endDate) && <span className="text-[10px] text-zinc-700">{formatDate(phase.startDate)} — {formatDate(phase.endDate)}</span>}
                        {phase.phaseNotes?.length > 0 && <span className="text-[10px] text-violet-500 flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{phase.phaseNotes.length}</span>}
                    </div>
                </div>
                {phase.isCompleted
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    : expanded ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />
                }
            </div>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden">
                        <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04] pt-2">
                            {phase.notes && (
                                <div className="flex items-start gap-1.5">
                                    <FileText className="w-3 h-3 text-zinc-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-zinc-400 whitespace-pre-wrap">{phase.notes}</p>
                                </div>
                            )}

                            {/* Phase Notes */}
                            {phase.phaseNotes?.length > 0 && (
                                <div className="space-y-1.5 mt-2">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" />Notlar</p>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {phase.phaseNotes.map(note => (
                                            <div key={note.id} className="bg-[#0a0a0b] rounded-lg px-2.5 py-1.5 border border-white/[0.03]">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[10px] font-medium text-violet-400">{note.authorName}</span>
                                                    <span className="text-[9px] text-zinc-700">{formatNoteDate(note.createdAt)}</span>
                                                </div>
                                                <p className="text-xs text-zinc-300 whitespace-pre-wrap">{note.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add Note Input */}
                            {project.status !== 'COMPLETED' && (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
                                        placeholder="Not ekle..."
                                        onKeyDown={e => { if (e.key === 'Enter' && noteText.trim()) { onAddNote(noteText.trim()); setNoteText(''); } }}
                                        className="flex-1 bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/30" />
                                    <button onClick={() => { if (noteText.trim()) { onAddNote(noteText.trim()); setNoteText(''); } }}
                                        disabled={!noteText.trim()}
                                        className="p-1.5 bg-violet-500/10 text-violet-400 rounded-lg hover:bg-violet-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {phase.isCompleted && phase.completedAt && (
                                <p className="text-[10px] text-emerald-600">Tamamland\u0131: {formatDate(phase.completedAt)}</p>
                            )}
                            {!phase.isCompleted && project.status !== 'COMPLETED' && (
                                <button onClick={onComplete}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-500/20 transition-colors">
                                    <CheckCircle2 className="w-3 h-3" /> Tamamland\u0131 olarak i\u015faretle
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
