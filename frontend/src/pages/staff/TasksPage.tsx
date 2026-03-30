import { useEffect, useState, useCallback } from 'react';
import { staffApi } from '../../api/staff';
import type { TaskResponse, CreateTaskRequest, AssignableUser, TaskNoteResponse } from '../../api/staff';
import type { CompanyResponse } from '../../api/admin';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ListTodo, Filter, User, Calendar, Clock, Building2, Trash2, MessageSquare, Send, ChevronRight, Tag, Flag, ArrowUpDown } from 'lucide-react';

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
    TODO: { bg: 'bg-zinc-800', text: 'text-zinc-400', label: 'Bekliyor' },
    IN_PROGRESS: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'Devam Ediyor' },
    DONE: { bg: 'bg-emerald-900/30', text: 'text-emerald-400', label: 'Tamamlandı' },
    OVERDUE: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Gecikmiş' },
};

const priorityBadge: Record<string, { bg: string; text: string; label: string }> = {
    LOW: { bg: 'bg-zinc-800', text: 'text-zinc-400', label: 'Düşük' },
    MEDIUM: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'Orta' },
    HIGH: { bg: 'bg-amber-900/30', text: 'text-amber-400', label: 'Yüksek' },
    URGENT: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Acil' },
};

const categoryLabels: Record<string, string> = {
    REELS: 'Reels', BLOG: 'Blog', PAYLASIM: 'Paylaşım', SEO: 'SEO',
    TASARIM: 'Tasarım', TOPLANTI: 'Toplantı', OTHER: 'Diğer',
};

function getRemainingTime(task: TaskResponse): { text: string; color: string } | null {
    if (task.status === 'DONE') return { text: 'Tamamlandı', color: 'text-emerald-400' };
    const endDate = task.endDate;
    if (!endDate) return null;
    let end: Date;
    if (task.endTime) {
        const datePart = endDate.slice(0, 10);
        const timePart = task.endTime.length <= 5 ? task.endTime + ':00' : task.endTime;
        end = new Date(datePart + 'T' + timePart);
    } else {
        end = new Date(endDate);
    }
    if (isNaN(end.getTime())) return null;
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return { text: 'Süre doldu', color: 'text-red-400' };
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffDay >= 1) return { text: `${diffDay} gün kaldı`, color: diffDay <= 2 ? 'text-amber-400' : 'text-zinc-400' };
    if (diffHour >= 1) return { text: `${diffHour} saat kaldı`, color: 'text-amber-400' };
    return { text: `${diffMin} dakika kaldı`, color: 'text-red-400' };
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'time' | 'priority' | 'company'>('time');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [companyFilter, setCompanyFilter] = useState<string>('ALL');
    const [form, setForm] = useState<CreateTaskRequest>({
        assignedToId: '', title: '', description: '', category: 'OTHER', priority: 'MEDIUM',
    });
    const [formLoading, setFormLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
    const [notes, setNotes] = useState<TaskNoteResponse[]>([]);
    const [noteText, setNoteText] = useState('');
    const [noteLoading, setNoteLoading] = useState(false);

    const loadTasks = useCallback(async () => {
        try {
            const data = await staffApi.getAllTasks(0, 100);
            setTasks(data.content);
        } catch { }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            loadTasks(),
            staffApi.getCompanies().then(setCompanies).catch(() => { }),
        ]).finally(() => setLoading(false));
    }, [loadTasks]);

    useEffect(() => {
        if (showForm) {
            staffApi.getAssignableUsers(form.companyId || undefined)
                .then(setAssignableUsers).catch(() => { });
        }
    }, [showForm, form.companyId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.assignedToId || !form.title) return;
        setFormLoading(true);
        try {
            const payload: CreateTaskRequest = { ...form, companyId: form.companyId || undefined };
            const created = await staffApi.createTask(payload);
            setTasks(prev => [created, ...prev]);
            setShowForm(false);
            setForm({ assignedToId: '', title: '', description: '', category: 'OTHER', priority: 'MEDIUM' });
        } catch { }
        setFormLoading(false);
    };

    const handleStatusChange = async (taskId: string, status: string) => {
        try {
            const updated = await staffApi.updateTask(taskId, { status });
            setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        } catch { }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
        try {
            await staffApi.deleteTask(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            if (selectedTask?.id === taskId) setSelectedTask(null);
        } catch { }
    };

    const openDetail = async (task: TaskResponse) => {
        setSelectedTask(task);
        setNotes([]);
        setNoteText('');
        try {
            const data = await staffApi.getTaskNotes(task.id);
            setNotes(data);
        } catch { }
    };

    const handleAddNote = async () => {
        if (!noteText.trim() || !selectedTask) return;
        setNoteLoading(true);
        try {
            const note = await staffApi.addTaskNote(selectedTask.id, noteText.trim());
            setNotes(prev => [note, ...prev]);
            setNoteText('');
        } catch { }
        setNoteLoading(false);
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await staffApi.deleteTaskNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch { }
    };

    // Determine effective status (mark expired tasks as overdue)
    const getEffectiveStatus = (task: TaskResponse): string => {
        if (task.status === 'DONE') return 'DONE';
        if (task.status === 'OVERDUE') return 'OVERDUE';
        if (task.endDate) {
            const endStr = task.endDate.slice(0, 10) + 'T' + (task.endTime && task.endTime.length > 5 ? task.endTime : (task.endTime || '23:59') + ':00');
            const end = new Date(endStr);
            if (!isNaN(end.getTime()) && end.getTime() < Date.now()) return 'OVERDUE';
        }
        return task.status;
    };

    const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    const filteredTasks = tasks
        .filter(t => {
            const eff = getEffectiveStatus(t);
            if (statusFilter !== 'ALL' && eff !== statusFilter) return false;
            if (companyFilter !== 'ALL' && (t.companyId || '') !== companyFilter) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'priority') {
                return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
            }
            if (sortBy === 'company') {
                return (a.companyName || 'zzz').localeCompare(b.companyName || 'zzz', 'tr');
            }
            // time: nearest deadline first, DONE tasks at bottom
            const getEndMs = (t: TaskResponse) => {
                if (t.status === 'DONE') return Infinity;
                if (!t.endDate) return Infinity;
                const datePart = t.endDate.slice(0, 10);
                const time = t.endTime && t.endTime.length > 5 ? t.endTime : (t.endTime || '23:59') + ':00';
                const d = new Date(datePart + 'T' + time);
                return isNaN(d.getTime()) ? Infinity : d.getTime();
            };
            const ea = getEndMs(a);
            const eb = getEndMs(b);
            return ea - eb;
        });

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Görevler</h1>
                    <p className="text-zinc-600 text-sm mt-1">Tüm görevleri yönetin</p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors">
                    <Plus className="w-4 h-4" /> Yeni Görev
                </button>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-zinc-600" />
                    {['ALL', 'TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#111113] text-zinc-500 hover:text-zinc-300'}`}>
                            {s === 'ALL' ? 'Tümü' : (statusBadge[s]?.label || s)}
                        </button>
                    ))}
                    <div className="w-px h-5 bg-white/[0.06] mx-1" />
                    <div className="relative">
                        <button onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111113] text-zinc-400 hover:text-zinc-300 transition-all">
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            {sortBy === 'time' ? 'Zamana Göre' : sortBy === 'priority' ? 'Öneme Göre' : 'Şirkete Göre'}
                        </button>
                        {showSortMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                                <div className="absolute top-full left-0 mt-1 z-20 bg-[#18181b] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden min-w-[150px]">
                                    {([['time', 'Zamana Göre'], ['priority', 'Öneme Göre'], ['company', 'Şirkete Göre']] as const).map(([val, label]) => (
                                        <button key={val} onClick={() => { setSortBy(val); setShowSortMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${sortBy === val ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111113] border border-white/[0.06] text-zinc-400 outline-none focus:border-emerald-500/50 transition-colors">
                    <option value="ALL">Tüm Şirketler</option>
                    <option value="">Ajans İçi</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="text-center py-20 text-zinc-600">Yükleniyor...</div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-20 bg-[#111113]/80 border border-white/[0.06] rounded-2xl">
                    <ListTodo className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">Görev bulunamadı.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredTasks.map((task, i) => {
                        const sBadge = statusBadge[task.status] || statusBadge.TODO;
                        const pBadge = priorityBadge[task.priority] || priorityBadge.MEDIUM;
                        const remaining = getRemainingTime(task);
                        return (
                            <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 hover:border-emerald-500/20 transition-colors group cursor-pointer"
                                onClick={() => openDetail(task)}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-1 h-14 rounded-full bg-gradient-to-b ${task.priority === 'URGENT' ? 'from-red-500 to-red-700' : task.priority === 'HIGH' ? 'from-amber-500 to-amber-700' : task.priority === 'MEDIUM' ? 'from-blue-500 to-blue-700' : 'from-zinc-600 to-zinc-800'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-white font-medium text-sm">{task.title}</p>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 uppercase font-bold">
                                                {categoryLabels[task.category] || task.category}
                                            </span>
                                            {remaining && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] font-bold ${remaining.color}`}>
                                                    ⏱ {remaining.text}
                                                </span>
                                            )}
                                        </div>
                                        {task.description && <p className="text-zinc-600 text-xs mt-1 line-clamp-1">{task.description}</p>}
                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            {task.companyName && (
                                                <span className="text-zinc-600 text-[11px] flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" /> {task.companyName}
                                                </span>
                                            )}
                                            <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                                                <User className="w-3 h-3" /> {task.assignedToName}
                                            </span>
                                            {(task.startDate || task.endDate) && (
                                                <span className="text-zinc-600 text-[11px] flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(task.startDate)}{task.startDate && task.endDate && ' → '}{formatDate(task.endDate)}
                                                </span>
                                            )}
                                            {(task.startTime || task.endTime) && (
                                                <span className="text-zinc-600 text-[11px] flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {task.startTime?.slice(0,5)}{task.startTime && task.endTime && ' - '}{task.endTime?.slice(0,5)}
                                                </span>
                                            )}
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${pBadge.bg} ${pBadge.text}`}>{pBadge.label}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 cursor-pointer ${sBadge.bg} ${sBadge.text}`}>
                                            <option value="TODO">Bekliyor</option>
                                            <option value="IN_PROGRESS">Devam Ediyor</option>
                                            <option value="DONE">Tamamlandı</option>
                                        </select>
                                        <button onClick={() => handleDelete(task.id)}
                                            className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Task Detail Panel */}
            <AnimatePresence>
                {selectedTask && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
                        onClick={() => setSelectedTask(null)}>
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="w-full max-w-lg bg-[#0c0c0e] border-l border-white/[0.06] h-full overflow-y-auto"
                            onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm border-b border-white/[0.06] p-5 z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${(statusBadge[selectedTask.status] || statusBadge.TODO).bg} ${(statusBadge[selectedTask.status] || statusBadge.TODO).text}`}>
                                            {(statusBadge[selectedTask.status] || statusBadge.TODO).label}
                                        </span>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${(priorityBadge[selectedTask.priority] || priorityBadge.MEDIUM).bg} ${(priorityBadge[selectedTask.priority] || priorityBadge.MEDIUM).text}`}>
                                            {(priorityBadge[selectedTask.priority] || priorityBadge.MEDIUM).label}
                                        </span>
                                    </div>
                                    <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <h2 className="text-lg font-bold text-white mt-3">{selectedTask.title}</h2>
                            </div>

                            {/* Details */}
                            <div className="p-5 space-y-5">
                                {selectedTask.description && (
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Açıklama</p>
                                        <p className="text-sm text-zinc-300 leading-relaxed">{selectedTask.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#111113] rounded-xl p-3 border border-white/[0.04]">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Atanan</p>
                                        <p className="text-sm text-white font-medium">{selectedTask.assignedToName}</p>
                                    </div>
                                    <div className="bg-[#111113] rounded-xl p-3 border border-white/[0.04]">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Building2 className="w-3 h-3" /> Şirket</p>
                                        <p className="text-sm text-white font-medium">{selectedTask.companyName || 'Ajans İçi'}</p>
                                    </div>
                                    <div className="bg-[#111113] rounded-xl p-3 border border-white/[0.04]">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3" /> Kategori</p>
                                        <p className="text-sm text-white font-medium">{categoryLabels[selectedTask.category] || selectedTask.category}</p>
                                    </div>
                                    <div className="bg-[#111113] rounded-xl p-3 border border-white/[0.04]">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Flag className="w-3 h-3" /> Oluşturan</p>
                                        <p className="text-sm text-white font-medium">{selectedTask.createdByName}</p>
                                    </div>
                                </div>

                                {(selectedTask.startDate || selectedTask.endDate) && (
                                    <div className="bg-[#111113] rounded-xl p-3 border border-white/[0.04]">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> Tarih & Saat</p>
                                        <div className="flex items-center gap-3">
                                            {selectedTask.startDate && (
                                                <div>
                                                    <p className="text-[10px] text-zinc-600">Başlangıç</p>
                                                    <p className="text-sm text-white font-medium">
                                                        {new Date(selectedTask.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        {selectedTask.startTime && <span className="text-zinc-400 ml-1">{selectedTask.startTime.slice(0, 5)}</span>}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedTask.startDate && selectedTask.endDate && (
                                                <ChevronRight className="w-4 h-4 text-zinc-600" />
                                            )}
                                            {selectedTask.endDate && (
                                                <div>
                                                    <p className="text-[10px] text-zinc-600">Bitiş</p>
                                                    <p className="text-sm text-white font-medium">
                                                        {new Date(selectedTask.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        {selectedTask.endTime && <span className="text-zinc-400 ml-1">{selectedTask.endTime.slice(0, 5)}</span>}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Remaining Time */}
                                {(() => {
                                    const rem = getRemainingTime(selectedTask);
                                    if (!rem) return null;
                                    return (
                                        <div className={`rounded-xl p-3 border ${rem.color === 'text-red-400' ? 'bg-red-500/5 border-red-500/20' : rem.color === 'text-amber-400' ? 'bg-amber-500/5 border-amber-500/20' : rem.color === 'text-emerald-400' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Kalan Süre</p>
                                            <p className={`text-sm font-bold ${rem.color}`}>⏱ {rem.text}</p>
                                        </div>
                                    );
                                })()}

                                {selectedTask.createdAt && (
                                    <p className="text-[10px] text-zinc-700">
                                        Oluşturulma: {new Date(selectedTask.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}

                                {/* Notes Section */}
                                <div className="border-t border-white/[0.06] pt-5">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                                        <MessageSquare className="w-4 h-4 text-emerald-400" /> Notlar
                                        {notes.length > 0 && <span className="text-[10px] text-zinc-600 bg-white/[0.04] rounded-full px-2 py-0.5">{notes.length}</span>}
                                    </h3>

                                    {/* Add note */}
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            value={noteText}
                                            onChange={e => setNoteText(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                                            placeholder="Not ekle..."
                                            className="flex-1 px-3 py-2 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                                        />
                                        <button onClick={handleAddNote} disabled={noteLoading || !noteText.trim()}
                                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-30">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Notes list */}
                                    <div className="space-y-2">
                                        {notes.map(note => (
                                            <div key={note.id} className="bg-[#111113] border border-white/[0.04] rounded-xl p-3 group/note">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[11px] font-semibold text-emerald-400">{note.authorName}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-zinc-700">
                                                            {new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <button onClick={() => handleDeleteNote(note.id)}
                                                            className="p-0.5 rounded text-zinc-800 hover:text-red-400 opacity-0 group-hover/note:opacity-100 transition-all">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-zinc-300">{note.content}</p>
                                            </div>
                                        ))}
                                        {notes.length === 0 && (
                                            <p className="text-center text-zinc-700 text-xs py-4">Henüz not eklenmemiş</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Task Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowForm(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                                <h3 className="text-lg font-bold text-white">Yeni Görev</h3>
                                <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Görev Başlığı *</label>
                                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                                        placeholder="Görev başlığı..." required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Atanan Kişi *</label>
                                    <select value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors" required>
                                        <option value="">Kişi seçiniz</option>
                                        {assignableUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName} ({u.globalRole === 'ADMIN' ? 'Admin' : u.globalRole === 'AGENCY_STAFF' ? 'Ajans' : 'Müşteri'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Şirket <span className="text-zinc-700">(opsiyonel)</span></label>
                                    <select value={form.companyId || ''} onChange={e => setForm(f => ({ ...f, companyId: e.target.value || undefined, assignedToId: '' }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors">
                                        <option value="">Ajans İçi (Şirketsiz)</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Açıklama</label>
                                    <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors resize-none"
                                        rows={3} placeholder="Görev detayları..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kategori</label>
                                        <select value={form.category || 'OTHER'} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors">
                                            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Öncelik</label>
                                        <select value={form.priority || 'MEDIUM'} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors">
                                            <option value="LOW">Düşük</option>
                                            <option value="MEDIUM">Orta</option>
                                            <option value="HIGH">Yüksek</option>
                                            <option value="URGENT">Acil</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Başlangıç Tarihi</label>
                                        <input type="date" value={form.startDate ? form.startDate.slice(0, 10) : ''}
                                            onChange={e => { const val = e.target.value; setForm(f => ({ ...f, startDate: val ? new Date(val).toISOString() : undefined })); }}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Başlangıç Saati</label>
                                        <input type="time" value={form.startTime || ''}
                                            onChange={e => setForm(f => ({ ...f, startTime: e.target.value || undefined }))}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bitiş Tarihi</label>
                                        <input type="date" value={form.endDate ? form.endDate.slice(0, 10) : ''}
                                            onChange={e => { const val = e.target.value; setForm(f => ({ ...f, endDate: val ? new Date(val).toISOString() : undefined })); }}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bitiş Saati</label>
                                        <input type="time" value={form.endTime || ''}
                                            onChange={e => setForm(f => ({ ...f, endTime: e.target.value || undefined }))}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors" />
                                    </div>
                                </div>
                                <button type="submit" disabled={formLoading}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                                    {formLoading ? 'Oluşturuluyor...' : 'Görevi Oluştur'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
