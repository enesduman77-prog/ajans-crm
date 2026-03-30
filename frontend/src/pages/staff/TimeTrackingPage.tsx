import { useEffect, useState } from 'react';
import { timeTrackingApi, type TimeEntryResponse } from '../../api/features';
import { staffApi, type TaskResponse } from '../../api/staff';
import { motion } from 'framer-motion';
import { Clock, Play, Square, Trash2, Loader2, Calendar } from 'lucide-react';

export default function TimeTrackingPage() {
    const [entries, setEntries] = useState<TimeEntryResponse[]>([]);
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [running, setRunning] = useState<TimeEntryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedTask, setSelectedTask] = useState('');
    const [description, setDescription] = useState('');

    const loadData = () => {
        setLoading(true);
        Promise.all([
            timeTrackingApi.getMyEntries(page, 20),
            timeTrackingApi.getRunning().catch(() => null),
            staffApi.getAllTasks(0, 100),
        ]).then(([entryData, runningEntry, taskData]) => {
            setEntries(entryData.content);
            setTotalPages(entryData.page?.totalPages ?? entryData.totalPages ?? 0);
            setRunning(runningEntry);
            setTasks(taskData.content.filter(t => t.status !== 'DONE'));
        }).catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, [page]);

    const startTimer = async () => {
        if (!selectedTask) return;
        try {
            await timeTrackingApi.start(selectedTask, description || undefined);
            setSelectedTask('');
            setDescription('');
            loadData();
        } catch (err) {
            console.error('Start timer error:', err);
        }
    };

    const stopTimer = async () => {
        try {
            await timeTrackingApi.stop();
            setRunning(null);
            loadData();
        } catch (err) {
            console.error('Stop timer error:', err);
        }
    };

    const deleteEntry = async (id: string) => {
        try {
            await timeTrackingApi.delete(id);
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Delete entry error:', err);
        }
    };

    const formatDuration = (minutes: number | null) => {
        if (!minutes) return '-';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}dk`;
        return `${h}sa ${m}dk`;
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-6 h-6 text-emerald-400" />
                        Zaman Takibi
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Görevlerde harcadığınız süreyi kaydedin</p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] text-zinc-500">Bu sayfadaki toplam</p>
                    <p className="text-lg font-bold text-emerald-400">{formatDuration(totalMinutes)}</p>
                </div>
            </div>

            {/* Active Timer */}
            {running ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Clock className="w-6 h-6 text-emerald-400" />
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{running.taskTitle}</p>
                                {running.description && <p className="text-[11px] text-zinc-500">{running.description}</p>}
                                <p className="text-[10px] text-emerald-400/60">{formatDate(running.startedAt)} tarihinde başladı</p>
                            </div>
                        </div>
                        <button
                            onClick={stopTimer}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
                        >
                            <Square className="w-4 h-4 fill-current" />
                            Durdur
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                    <p className="text-[13px] text-zinc-400 mb-3">Yeni zamanlayıcı başlat</p>
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={selectedTask}
                            onChange={e => setSelectedTask(e.target.value)}
                            className="flex-1 min-w-[200px] px-3 py-2 bg-[#09090b] border border-white/[0.08] rounded-xl text-sm text-white outline-none focus:border-emerald-500/40"
                        >
                            <option value="">Görev seçin...</option>
                            {tasks.map(t => (
                                <option key={t.id} value={t.id}>{t.title} — {t.companyName}</option>
                            ))}
                        </select>
                        <input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Açıklama (opsiyonel)"
                            className="flex-1 min-w-[150px] px-3 py-2 bg-[#09090b] border border-white/[0.08] rounded-xl text-sm text-white outline-none focus:border-emerald-500/40 placeholder:text-zinc-700"
                        />
                        <button
                            onClick={startTimer}
                            disabled={!selectedTask}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            Başlat
                        </button>
                    </div>
                </div>
            )}

            {/* Entries Table */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <span>Görev</span>
                    <span>Açıklama</span>
                    <span>Başlangıç</span>
                    <span>Süre</span>
                    <span></span>
                </div>

                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                        <Calendar className="w-8 h-8 mb-2 opacity-40" />
                        <p className="text-[13px]">Zaman kaydı bulunamadı</p>
                    </div>
                ) : (
                    entries.map((entry, idx) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 items-center border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                        >
                            <div>
                                <p className="text-[13px] text-white truncate">{entry.taskTitle}</p>
                                <p className="text-[10px] text-zinc-600">{entry.companyName}</p>
                            </div>
                            <p className="text-[12px] text-zinc-400 truncate">{entry.description || '-'}</p>
                            <span className="text-[11px] text-zinc-500 whitespace-nowrap">{formatDate(entry.startedAt)}</span>
                            <span className={`text-[13px] font-mono font-medium whitespace-nowrap ${entry.isRunning ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                {entry.isRunning ? '⏱ Devam ediyor' : formatDuration(entry.durationMinutes)}
                            </span>
                            <button
                                onClick={() => deleteEntry(entry.id)}
                                className="p-1.5 text-zinc-700 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 rounded-lg text-[12px] bg-white/[0.04] border border-white/[0.06] text-zinc-400 disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
                    >
                        Önceki
                    </button>
                    <span className="text-[12px] text-zinc-500">{page + 1} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1.5 rounded-lg text-[12px] bg-white/[0.04] border border-white/[0.06] text-zinc-400 disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
                    >
                        Sonraki
                    </button>
                </div>
            )}
        </div>
    );
}
