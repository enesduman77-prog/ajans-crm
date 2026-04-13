import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import type { AdminRoutineResponse, CreateRoutineRequest, PageResponse } from '../../api/admin';
import { staffApi } from '../../api/staff';
import type { AssignableUser } from '../../api/staff';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw, Plus, Trash2, Edit3, X, Check, Pause, Play,
    Calendar, Clock, Users, Loader2
} from 'lucide-react';

const FREQ_LABELS: Record<string, string> = {
    DAILY: 'Günlük',
    WEEKLY: 'Haftalık',
    MONTHLY: 'Aylık',
};

const DAY_NAMES: Record<number, string> = {
    1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe',
    5: 'Cuma', 6: 'Cumartesi', 7: 'Pazar',
};

const CATEGORY_LABELS: Record<string, string> = {
    REELS: 'Reels', BLOG: 'Blog', PAYLASIM: 'Paylaşım', SEO: 'SEO',
    TASARIM: 'Tasarım', TOPLANTI: 'Toplantı', OTHER: 'Diğer',
};

function getScheduleLabel(r: AdminRoutineResponse): string {
    if (r.frequency === 'DAILY') return 'Her gün';
    if (r.frequency === 'WEEKLY' && r.dayOfWeek) return `Her ${DAY_NAMES[r.dayOfWeek]}`;
    if (r.frequency === 'MONTHLY') {
        if (r.dayOfMonth === 0) return 'Her ayın son günü';
        if (r.dayOfMonth) return `Her ayın ${r.dayOfMonth}. günü`;
        return 'Aylık';
    }
    return FREQ_LABELS[r.frequency] || r.frequency;
}

export default function RoutineManagementPage() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CreateRoutineRequest>({
        title: '',
        frequency: 'DAILY',
    });

    const { data: routinesData, isLoading } = useQuery<PageResponse<AdminRoutineResponse>>({
        queryKey: ['admin-routines'],
        queryFn: () => adminApi.getRoutines(),
    });

    const { data: staffList } = useQuery<AssignableUser[]>({
        queryKey: ['assignable-users'],
        queryFn: () => staffApi.getAssignableUsers(),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateRoutineRequest) => adminApi.createRoutine(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-routines'] });
            resetForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoutineRequest> & { isActive?: boolean } }) =>
            adminApi.updateRoutine(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-routines'] });
            resetForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteRoutine(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-routines'] }),
    });

    const routines = routinesData?.content ?? [];

    function resetForm() {
        setForm({ title: '', frequency: 'DAILY' });
        setShowForm(false);
        setEditingId(null);
    }

    function startEdit(r: AdminRoutineResponse) {
        setEditingId(r.id);
        setForm({
            title: r.title,
            description: r.description ?? undefined,
            frequency: r.frequency,
            dayOfWeek: r.dayOfWeek ?? undefined,
            dayOfMonth: r.dayOfMonth ?? undefined,
            executionTime: r.executionTime ?? undefined,
            assignedToId: r.assignedToId ?? undefined,
            category: r.category,
        });
        setShowForm(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) return;
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: form });
        } else {
            createMutation.mutate(form);
        }
    }

    function toggleActive(r: AdminRoutineResponse) {
        updateMutation.mutate({ id: r.id, data: { isActive: !r.isActive } });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <RefreshCw className="w-6 h-6 text-violet-400" />
                        Rutin Görevler
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Tekrarlayan görevleri oluşturun ve çalışanlara otomatik atayın
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 text-violet-400 rounded-xl hover:bg-violet-500/20 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Rutin
                </button>
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6 space-y-5"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">
                                {editingId ? 'Rutini Düzenle' : 'Yeni Rutin Oluştur'}
                            </h2>
                            <button onClick={resetForm} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Başlık*</label>
                                <input
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Örn: Sosyal medya paylaşımları"
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/30"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Açıklama</label>
                                <textarea
                                    value={form.description ?? ''}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value || undefined }))}
                                    placeholder="Rutin hakkında detay..."
                                    rows={2}
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/30 resize-none"
                                />
                            </div>

                            {/* Frequency + Schedule Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Frequency */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sıklık*</label>
                                    <select
                                        value={form.frequency}
                                        onChange={e => setForm(f => ({ ...f, frequency: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY', dayOfWeek: undefined, dayOfMonth: undefined }))}
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30"
                                    >
                                        <option value="DAILY">Günlük</option>
                                        <option value="WEEKLY">Haftalık</option>
                                        <option value="MONTHLY">Aylık</option>
                                    </select>
                                </div>

                                {/* Day of week (weekly) */}
                                {form.frequency === 'WEEKLY' && (
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Gün</label>
                                        <select
                                            value={form.dayOfWeek ?? ''}
                                            onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value ? parseInt(e.target.value) : undefined }))}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30"
                                        >
                                            <option value="">Her gün</option>
                                            {Object.entries(DAY_NAMES).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Day of month (monthly) */}
                                {form.frequency === 'MONTHLY' && (
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Ayın Günü</label>
                                        <select
                                            value={form.dayOfMonth ?? ''}
                                            onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value !== '' ? parseInt(e.target.value) : undefined }))}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30"
                                        >
                                            <option value="">Seçin</option>
                                            <option value="0">Son gün</option>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                <option key={d} value={d}>{d}. gün</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Execution Time */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Saat</label>
                                    <input
                                        type="time"
                                        value={form.executionTime ?? ''}
                                        onChange={e => setForm(f => ({ ...f, executionTime: e.target.value || undefined }))}
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30"
                                    />
                                </div>
                            </div>

                            {/* Assignee + Category Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Assigned To */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Atanan Kişi</label>
                                    <select
                                        value={form.assignedToId ?? ''}
                                        onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value || undefined }))}
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30"
                                    >
                                        <option value="">Tüm Çalışanlar</option>
                                        {staffList?.map(s => (
                                            <option key={s.id} value={s.id}>{s.fullName}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Kategori</label>
                                    <select
                                        value={form.category ?? 'OTHER'}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30"
                                    >
                                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl hover:bg-violet-600 disabled:opacity-50 transition-colors text-sm font-medium"
                                >
                                    <Check className="w-4 h-4" />
                                    {editingId ? 'Güncelle' : 'Oluştur'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-5 py-2.5 text-zinc-400 hover:text-white transition-colors text-sm"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Routines List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
            ) : routines.length === 0 ? (
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <RefreshCw className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">Henüz rutin görev tanımlanmamış</p>
                    <p className="text-zinc-600 text-xs mt-1">Yukarıdaki "Yeni Rutin" butonuyla başlayın</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {routines.map((r) => (
                        <motion.div
                            key={r.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: r.isActive ? 1 : 0.5 }}
                            className={`bg-[#0C0C0E] border rounded-xl px-5 py-4 flex items-center gap-4 transition-colors ${
                                r.isActive ? 'border-white/[0.06] hover:border-violet-500/20' : 'border-white/[0.04]'
                            }`}
                        >
                            {/* Frequency Badge */}
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                r.frequency === 'DAILY' ? 'bg-pink-500/10' :
                                r.frequency === 'WEEKLY' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                            }`}>
                                <RefreshCw className={`w-4 h-4 ${
                                    r.frequency === 'DAILY' ? 'text-pink-400' :
                                    r.frequency === 'WEEKLY' ? 'text-blue-400' : 'text-amber-400'
                                }`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm font-medium truncate ${r.isActive ? 'text-white' : 'text-zinc-500 line-through'}`}>
                                        {r.title}
                                    </p>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                        r.frequency === 'DAILY' ? 'bg-pink-500/10 text-pink-400' :
                                        r.frequency === 'WEEKLY' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                                    }`}>
                                        {FREQ_LABELS[r.frequency]}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500 flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {getScheduleLabel(r)}
                                    </span>
                                    {r.executionTime && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {r.executionTime.slice(0, 5)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {r.assignedToName}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => toggleActive(r)}
                                    title={r.isActive ? 'Duraklat' : 'Aktifleştir'}
                                    className="p-2 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-white transition-colors"
                                >
                                    {r.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => startEdit(r)}
                                    className="p-2 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-white transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { if (window.confirm('Bu rutini silmek istediğinize emin misiniz?')) deleteMutation.mutate(r.id); }}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
