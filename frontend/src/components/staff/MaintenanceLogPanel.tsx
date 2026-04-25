import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wrench, Plus, Pencil, Trash2, Save, X, Loader2, Clock } from 'lucide-react';
import { webDesignApi, type MaintenanceLogEntry, type MaintenanceLogRequest } from '../../api/webDesign';

interface Props {
    companyId: string;
}

const CATEGORY_OPTIONS = [
    { value: 'update', label: 'Güncelleme' },
    { value: 'fix', label: 'Hata Düzeltme' },
    { value: 'feature', label: 'Yeni Özellik' },
    { value: 'security', label: 'Güvenlik' },
    { value: 'content', label: 'İçerik' },
    { value: 'seo', label: 'SEO' },
    { value: 'other', label: 'Diğer' },
];

const CATEGORY_COLORS: Record<string, string> = {
    update: 'bg-blue-500/10 text-blue-400',
    fix: 'bg-red-500/10 text-red-400',
    feature: 'bg-emerald-500/10 text-emerald-400',
    security: 'bg-amber-500/10 text-amber-400',
    content: 'bg-violet-500/10 text-violet-400',
    seo: 'bg-pink-500/10 text-pink-400',
    other: 'bg-zinc-700/50 text-zinc-400',
};

function inputCls() {
    return 'bg-[#0C0C0E] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[#C8697A]/50 focus:outline-none w-full';
}

function todayLocal(): string {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function emptyForm(): MaintenanceLogRequest {
    return { title: '', description: '', category: 'update', performedAt: new Date().toISOString() };
}

export default function MaintenanceLogPanel({ companyId }: Props) {
    const qc = useQueryClient();

    const { data: log = [], isLoading } = useQuery<MaintenanceLogEntry[]>({
        queryKey: ['maintenance-log', companyId],
        queryFn: () => webDesignApi.getCompanyMaintenanceLog(companyId),
    });

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<MaintenanceLogRequest>(emptyForm());
    const [dateLocal, setDateLocal] = useState(todayLocal());

    const invalidate = () => qc.invalidateQueries({ queryKey: ['maintenance-log', companyId] });

    const createMut = useMutation({
        mutationFn: (d: MaintenanceLogRequest) => webDesignApi.createMaintenanceLog(companyId, d),
        onSuccess: () => { invalidate(); reset(); },
    });
    const updateMut = useMutation({
        mutationFn: ({ id, d }: { id: string; d: MaintenanceLogRequest }) =>
            webDesignApi.updateMaintenanceLog(companyId, id, d),
        onSuccess: () => { invalidate(); reset(); },
    });
    const deleteMut = useMutation({
        mutationFn: (id: string) => webDesignApi.deleteMaintenanceLog(companyId, id),
        onSuccess: invalidate,
    });

    function reset() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm());
        setDateLocal(todayLocal());
    }

    function startEdit(e: MaintenanceLogEntry) {
        setEditingId(e.id);
        setShowForm(true);
        setForm({ title: e.title, description: e.description ?? '', category: e.category, performedAt: e.performedAt });
        const d = new Date(e.performedAt);
        setDateLocal(new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
    }

    function submit() {
        const payload = { ...form, performedAt: new Date(dateLocal).toISOString() };
        if (editingId) updateMut.mutate({ id: editingId, d: payload });
        else createMut.mutate(payload);
    }

    const busy = createMut.isPending || updateMut.isPending;

    return (
        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#F5BEC8]" />
                    <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                        Bakım Günlüğü
                    </h3>
                    <span className="text-[11px] text-zinc-600">({log.length})</span>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); setDateLocal(todayLocal()); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8697A]/10 text-[#F5BEC8] text-xs font-medium hover:bg-[#C8697A]/20 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Kayıt Ekle
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Başlık *</label>
                            <input className={inputCls()} placeholder="Örn: Ana sayfa banner güncellendi"
                                value={form.title}
                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Kategori</label>
                            <select className={inputCls()} value={form.category}
                                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                {CATEGORY_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Tarih *</label>
                            <input type="datetime-local" className={inputCls()}
                                value={dateLocal}
                                onChange={e => setDateLocal(e.target.value)} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Açıklama</label>
                            <textarea className={`${inputCls()} min-h-[72px] resize-none`}
                                placeholder="Ne yapıldığını kısaca açıklayın..."
                                value={form.description ?? ''}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button onClick={reset}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors">
                            <X className="w-3.5 h-3.5" /> İptal
                        </button>
                        <button onClick={submit} disabled={!form.title.trim() || busy}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#C8697A] text-white text-xs font-medium hover:bg-[#B85B6E] disabled:opacity-40 transition-colors">
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {editingId ? 'Güncelle' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            )}

            {/* Liste */}
            {isLoading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                </div>
            ) : log.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">Henüz bakım kaydı eklenmemiş.</p>
            ) : (
                <div className="space-y-2">
                    {log.map(entry => {
                        const catLabel = CATEGORY_OPTIONS.find(o => o.value === entry.category)?.label ?? entry.category;
                        const catColor = CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.other;
                        return (
                            <div key={entry.id}
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-white">{entry.title}</p>
                                        <span className="text-[11px] text-zinc-500 flex items-center gap-1 flex-shrink-0">
                                            <Clock className="w-3 h-3" />
                                            {new Date(entry.performedAt).toLocaleDateString('tr-TR', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${catColor}`}>
                                            {catLabel}
                                        </span>
                                        {entry.performedByName && (
                                            <span className="text-[11px] text-zinc-500">{entry.performedByName}</span>
                                        )}
                                    </div>
                                    {entry.description && (
                                        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{entry.description}</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 flex-shrink-0">
                                    <button onClick={() => startEdit(entry)}
                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                                        title="Düzenle">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('Bu kayıt silinsin mi?')) deleteMut.mutate(entry.id); }}
                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Sil">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
