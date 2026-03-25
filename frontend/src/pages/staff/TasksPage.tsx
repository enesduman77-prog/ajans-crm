import { useEffect, useState } from 'react';
import { staffApi } from '../../api/staff';
import type { TaskResponse, CreateTaskRequest } from '../../api/staff';
import type { CompanyResponse } from '../../api/admin';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ListTodo, Filter } from 'lucide-react';

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
    TODO: { bg: 'bg-zinc-800', text: 'text-zinc-400', label: 'Bekliyor' },
    IN_PROGRESS: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'Devam Ediyor' },
    DONE: { bg: 'bg-emerald-900/30', text: 'text-emerald-400', label: 'Tamamlandı' },
    OVERDUE: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Gecikmiş' },
};

const priorityBadge: Record<string, { bg: string; text: string }> = {
    LOW: { bg: 'bg-zinc-800', text: 'text-zinc-400' },
    MEDIUM: { bg: 'bg-blue-900/30', text: 'text-blue-400' },
    HIGH: { bg: 'bg-amber-900/30', text: 'text-amber-400' },
    URGENT: { bg: 'bg-red-900/30', text: 'text-red-400' },
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [form, setForm] = useState<CreateTaskRequest>({
        companyId: '', title: '', description: '', category: 'OTHER', priority: 'MEDIUM',
    });

    useEffect(() => {
        Promise.all([
            staffApi.getAllTasks(0, 50),
            staffApi.getCompanies(),
        ]).then(([taskData, companyData]) => {
            setTasks(taskData.content);
            setCompanies(companyData);
        }).catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.companyId || !form.title) return;
        const created = await staffApi.createTask(form);
        setTasks(prev => [created, ...prev]);
        setShowForm(false);
        setForm({ companyId: '', title: '', description: '', category: 'OTHER', priority: 'MEDIUM' });
    };

    const handleStatusChange = async (taskId: string, status: string) => {
        const updated = await staffApi.updateTask(taskId, { status });
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    };

    const filteredTasks = statusFilter === 'ALL' ? tasks : tasks.filter(t => t.status === statusFilter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Görevler</h1>
                    <p className="text-zinc-600 text-sm mt-1">Tüm görevleri yönetin</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Görev
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-600" />
                {['ALL', 'TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'].map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-[#111113] text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        {s === 'ALL' ? 'Tümü' : (statusBadge[s]?.label || s)}
                    </button>
                ))}
            </div>

            {/* Task List */}
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
                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 hover:border-emerald-500/20 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-1 h-12 rounded-full bg-gradient-to-b ${task.priority === 'URGENT' ? 'from-red-500 to-red-700' :
                                        task.priority === 'HIGH' ? 'from-amber-500 to-amber-700' :
                                            task.priority === 'MEDIUM' ? 'from-blue-500 to-blue-700' :
                                                'from-zinc-600 to-zinc-800'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-sm">{task.title}</p>
                                        {task.description && <p className="text-zinc-600 text-xs mt-1 line-clamp-1">{task.description}</p>}
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-zinc-600 text-[11px]">{task.companyName}</span>
                                            {task.assignedToName && (
                                                <span className="text-zinc-600 text-[11px]">→ {task.assignedToName}</span>
                                            )}
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${pBadge.bg} ${pBadge.text}`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>
                                    <select
                                        value={task.status}
                                        onChange={e => handleStatusChange(task.id, e.target.value)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 cursor-pointer ${sBadge.bg} ${sBadge.text}`}
                                    >
                                        <option value="TODO">Bekliyor</option>
                                        <option value="IN_PROGRESS">Devam Ediyor</option>
                                        <option value="DONE">Tamamlandı</option>
                                    </select>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-lg"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                                <h3 className="text-lg font-bold text-white">Yeni Görev</h3>
                                <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Şirket *</label>
                                    <select
                                        value={form.companyId}
                                        onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white"
                                        required
                                    >
                                        <option value="">Seçiniz</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Başlık *</label>
                                    <input
                                        value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Açıklama</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white resize-none"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kategori</label>
                                        <select
                                            value={form.category}
                                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white"
                                        >
                                            <option value="REELS">Reels</option>
                                            <option value="BLOG">Blog</option>
                                            <option value="PAYLASIM">Paylaşım</option>
                                            <option value="SEO">SEO</option>
                                            <option value="TASARIM">Tasarım</option>
                                            <option value="OTHER">Diğer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Öncelik</label>
                                        <select
                                            value={form.priority}
                                            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white"
                                        >
                                            <option value="LOW">Düşük</option>
                                            <option value="MEDIUM">Orta</option>
                                            <option value="HIGH">Yüksek</option>
                                            <option value="URGENT">Acil</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors"
                                >
                                    Görevi Oluştur
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
