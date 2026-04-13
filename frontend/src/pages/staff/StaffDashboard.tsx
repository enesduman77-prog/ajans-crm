import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import type { TaskResponse, NoteResponse, PageResponse } from '../../api/staff';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, Clock, CheckCircle2, ArrowRight, StickyNote, Plus, Trash2, Circle, CircleCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import TaskDetailPanel from '../../components/TaskDetailPanel';

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
    TODO: { bg: 'bg-zinc-800', text: 'text-zinc-400', label: 'Bekliyor' },
    IN_PROGRESS: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'Devam Ediyor' },
    DONE: { bg: 'bg-pink-900/30', text: 'text-pink-400', label: 'Tamamlandı' },
    OVERDUE: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Gecikmiş' },
};

export default function StaffDashboard() {
    const queryClient = useQueryClient();
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

    const handleStatusChange = async (taskId: string, status: string) => {
        try {
            const updated = await staffApi.updateTask(taskId, { status });
            setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
            if (selectedTask?.id === taskId) setSelectedTask(updated);
        } catch { }
    };

    useEffect(() => {
        staffApi.getMyTasks(0, 10)
            .then(data => setTasks(data.content))
            .catch(() => setTasks([]))
            .finally(() => setLoading(false));
    }, []);

    const { data: notesData } = useQuery<PageResponse<NoteResponse>>({
        queryKey: ['staff-notes'],
        queryFn: () => staffApi.getNotes(0, 20),
    });

    const createNoteMutation = useMutation({
        mutationFn: (content: string) => staffApi.createNote({ content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-notes'] });
            setNewNote('');
        },
    });

    const toggleNoteMutation = useMutation({
        mutationFn: (noteId: string) => staffApi.toggleNote(noteId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-notes'] }),
    });

    const deleteNoteMutation = useMutation({
        mutationFn: (noteId: string) => staffApi.deleteNote(noteId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-notes'] }),
    });

    const notes = notesData?.content || [];

    const todayTasks = tasks.filter(t => t.status !== 'DONE');
    const doneTasks = tasks.filter(t => t.status === 'DONE');

    const stats = [
        { icon: ListTodo, label: 'Aktif Görevler', value: todayTasks.length, color: 'from-blue-500 to-cyan-500' },
        { icon: CheckCircle2, label: 'Tamamlanan', value: doneTasks.length, color: 'from-pink-500 to-pink-500' },
        { icon: Clock, label: 'Toplam', value: tasks.length, color: 'from-violet-500 to-purple-500' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Günlük Panel</h1>
                <p className="text-zinc-600 text-sm mt-1">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-black text-white">{loading ? '—' : stat.value}</span>
                        </div>
                        <p className="text-zinc-500 text-xs font-semibold mt-3 uppercase tracking-wider">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Task List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Aktif Görevler</h2>
                    <Link to="/staff/tasks" className="text-pink-400 hover:text-pink-300 text-sm flex items-center gap-1 transition-colors">
                        Tümünü Gör <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-zinc-600">Yükleniyor...</div>
                ) : todayTasks.length === 0 ? (
                    <div className="text-center py-12 bg-[#0C0C0E]/80 border border-white/[0.06] rounded-2xl">
                        <CheckCircle2 className="w-10 h-10 text-pink-500/50 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">Aktif görev bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {todayTasks.map((task, i) => {
                            const badge = statusBadge[task.status] || statusBadge.TODO;
                            return (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelectedTask(task)}
                                    className="bg-[#0C0C0E] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4 hover:border-pink-500/20 transition-colors cursor-pointer"
                                >
                                    <div className={`w-1 h-10 rounded-full bg-gradient-to-b from-pink-500 to-pink-700`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-sm truncate">{task.title}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-zinc-600 text-xs">{task.companyName}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                                        {badge.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Notes */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-amber-400" /> Notlarım
                </h2>
                <div className="flex gap-2">
                    <input
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && newNote.trim()) createNoteMutation.mutate(newNote.trim()); }}
                        placeholder="Yeni not ekle..."
                        className="flex-1 bg-[#0C0C0E] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/30"
                    />
                    <button
                        onClick={() => { if (newNote.trim()) createNoteMutation.mutate(newNote.trim()); }}
                        disabled={!newNote.trim() || createNoteMutation.isPending}
                        className="px-4 py-2.5 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {notes.length === 0 ? (
                    <div className="text-center py-8 bg-[#0C0C0E]/80 border border-white/[0.06] rounded-2xl">
                        <StickyNote className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-zinc-600 text-sm">Henüz not eklenmemiş</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <AnimatePresence mode="popLayout">
                            {notes.map(note => (
                                <motion.div
                                    key={note.id}
                                    layout
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-3 bg-[#0C0C0E] border border-white/[0.06] rounded-xl px-4 py-3 group"
                                >
                                    <button onClick={() => toggleNoteMutation.mutate(note.id)} className="shrink-0">
                                        {note.isOpen ? <Circle className="w-4 h-4 text-zinc-600" /> : <CircleCheck className="w-4 h-4 text-pink-500" />}
                                    </button>
                                    <span className={`flex-1 text-sm ${note.isOpen ? 'text-white' : 'text-zinc-600 line-through'}`}>{note.content}</span>
                                    {note.companyName && <span className="text-[10px] text-zinc-600 bg-white/5 px-2 py-0.5 rounded">{note.companyName}</span>}
                                    <button onClick={() => deleteNoteMutation.mutate(note.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <TaskDetailPanel
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
}
