import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeTrackingApi, type TimeEntryResponse } from '../../api/features';
import { staffApi, type TaskResponse, type PageResponse } from '../../api/staff';
import { motion } from 'framer-motion';
import { Clock, Play, Square, Trash2, Calendar, Timer, Briefcase } from 'lucide-react';

/* ─── Helpers ─── */
function formatDuration(minutes: number | null) {
    if (!minutes && minutes !== 0) return '-';
    if (minutes === 0) return '0dk';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}dk`;
    return `${h}sa ${m}dk`;
}

function formatElapsed(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
}

function formatDateGroup(date: string) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Bugün';
    if (d.toDateString() === yesterday.toDateString()) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
}

/* ─── Live Timer Hook ─── */
function useElapsedTimer(startedAt: string | null) {
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!startedAt) { setElapsed(0); return; }
        const start = new Date(startedAt).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));

        intervalRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [startedAt]);

    return elapsed;
}

/* ─── Component ─── */
export default function TimeTrackingPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [selectedTask, setSelectedTask] = useState('');
    const [description, setDescription] = useState('');

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['time-entries'] });
        queryClient.invalidateQueries({ queryKey: ['time-running'] });
    };

    // ─── Queries ───
    const { data: entriesData, isLoading: loadingEntries } = useQuery<PageResponse<TimeEntryResponse>>({
        queryKey: ['time-entries', page],
        queryFn: () => timeTrackingApi.getMyEntries(page, 20),
    });

    const { data: running } = useQuery<TimeEntryResponse | null>({
        queryKey: ['time-running'],
        queryFn: () => timeTrackingApi.getRunning(),
        refetchInterval: 30000,
    });

    const { data: taskData } = useQuery<PageResponse<TaskResponse>>({
        queryKey: ['time-tasks'],
        queryFn: () => staffApi.getMyTasks(0, 200),
    });

    // ─── Mutations ───
    const startMutation = useMutation({
        mutationFn: () => timeTrackingApi.start(selectedTask, description || undefined),
        onSuccess: () => {
            setSelectedTask('');
            setDescription('');
            invalidateAll();
        },
    });

    const stopMutation = useMutation({
        mutationFn: () => timeTrackingApi.stop(),
        onSuccess: () => invalidateAll(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => timeTrackingApi.delete(id),
        onSuccess: () => invalidateAll(),
    });

    // ─── Derived data ───
    const entries = entriesData?.content ?? [];
    const totalPages = entriesData?.totalPages ?? 0;
    const tasks = (taskData?.content ?? []).filter(t => t.status !== 'DONE');
    const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

    const elapsed = useElapsedTimer(running?.startedAt ?? null);

    // Group entries by date
    const groupedEntries: Record<string, TimeEntryResponse[]> = {};
    entries.forEach(e => {
        const key = new Date(e.startedAt).toDateString();
        if (!groupedEntries[key]) groupedEntries[key] = [];
        groupedEntries[key].push(e);
    });

    if (loadingEntries && entries.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-6 w-6 border-2 border-emerald-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
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

            {/* ─── Active Timer ─── */}
            {running ? (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-xl">
                                <Timer className="w-6 h-6 text-emerald-400" />
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{running.taskTitle || 'Görev'}</p>
                                {running.companyName && (
                                    <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                                        <Briefcase className="w-3 h-3" />
                                        {running.companyName}
                                    </p>
                                )}
                                {running.description && <p className="text-[11px] text-zinc-600 mt-0.5">{running.description}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
                                    {formatElapsed(elapsed)}
                                </p>
                                <p className="text-[10px] text-emerald-400/50">{formatDate(running.startedAt)}'den beri</p>
                            </div>
                            <button
                                onClick={() => stopMutation.mutate()}
                                disabled={stopMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors disabled:opacity-50"
                            >
                                <Square className="w-4 h-4 fill-current" />
                                Durdur
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                /* ─── Start New Timer ─── */
                <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                    <p className="text-[13px] text-zinc-400 mb-3 font-medium">Yeni zamanlayıcı başlat</p>
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={selectedTask}
                            onChange={e => setSelectedTask(e.target.value)}
                            className="flex-1 min-w-[200px] px-3 py-2.5 bg-[#09090b] border border-white/[0.08] rounded-xl text-sm text-white outline-none focus:border-emerald-500/40 transition-colors"
                        >
                            <option value="">Görev seçin...</option>
                            {tasks.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.title}{t.companyName ? ` — ${t.companyName}` : ''}
                                </option>
                            ))}
                        </select>
                        <input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Açıklama (opsiyonel)"
                            onKeyDown={e => { if (e.key === 'Enter' && selectedTask) startMutation.mutate(); }}
                            className="flex-1 min-w-[150px] px-3 py-2.5 bg-[#09090b] border border-white/[0.08] rounded-xl text-sm text-white outline-none focus:border-emerald-500/40 placeholder:text-zinc-700 transition-colors"
                        />
                        <button
                            onClick={() => startMutation.mutate()}
                            disabled={!selectedTask || startMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            Başlat
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Entries ─── */}
            {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                    <Calendar className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">Henüz zaman kaydı yok</p>
                    <p className="text-xs text-zinc-700 mt-1">Bir görev seçip zamanlayıcıyı başlatın</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedEntries).map(([dateKey, dayEntries]) => (
                        <div key={dateKey}>
                            {/* Day header */}
                            <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                                    {formatDateGroup(dayEntries[0].startedAt)}
                                </span>
                                <span className="text-[11px] text-zinc-600">
                                    {formatDuration(dayEntries.reduce((s, e) => s + (e.durationMinutes || 0), 0))}
                                </span>
                            </div>

                            {/* Day entries */}
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
                                {dayEntries.map((entry, idx) => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                                    >
                                        {/* Task info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] text-white font-medium truncate">
                                                {entry.taskTitle || 'Görev'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {entry.companyName && (
                                                    <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                                                        <Briefcase className="w-2.5 h-2.5" />
                                                        {entry.companyName}
                                                    </span>
                                                )}
                                                {entry.description && (
                                                    <span className="text-[10px] text-zinc-600 truncate">
                                                        {entry.companyName ? '·' : ''} {entry.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Time range */}
                                        <div className="text-right shrink-0">
                                            <span className="text-[11px] text-zinc-500">
                                                {new Date(entry.startedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                {entry.endedAt && (
                                                    <> — {new Date(entry.endedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</>
                                                )}
                                            </span>
                                        </div>

                                        {/* Duration */}
                                        <span className={`text-[13px] font-mono font-semibold whitespace-nowrap shrink-0 min-w-[70px] text-right ${entry.isRunning ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                            {entry.isRunning ? '⏱ Aktif' : formatDuration(entry.durationMinutes)}
                                        </span>

                                        {/* Delete */}
                                        <button
                                            onClick={() => deleteMutation.mutate(entry.id)}
                                            disabled={deleteMutation.isPending}
                                            className="p-1.5 text-zinc-800 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
