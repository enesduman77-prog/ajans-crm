import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import { settingsApi } from '../../api/settings';
import type { TaskResponse, ShootResponse, MeetingResponse, PrProjectResponse, NoteResponse, PageResponse } from '../../api/staff';
import { useAuth } from '../../store/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sun, Moon, Coffee, Sunrise,
    CheckCircle2, Clock, AlertTriangle, Camera, Rocket, Users, Calendar,
    ArrowRight, ChevronRight, Flame, Target, TrendingUp, Zap,
    StickyNote, Plus, Trash2, Circle, CircleCheck, MapPin, Briefcase, Star, Pencil
} from 'lucide-react';
import TaskDetailPanel from '../../components/TaskDetailPanel';

/* ─── Helpers ─── */
function getGreeting(): { text: string; icon: React.ReactNode } {
    const h = new Date().getHours();
    if (h < 6) return { text: 'İyi geceler', icon: <Moon className="w-5 h-5 text-indigo-400" /> };
    if (h < 12) return { text: 'Günaydın', icon: <Sunrise className="w-5 h-5 text-amber-400" /> };
    if (h < 18) return { text: 'İyi günler', icon: <Sun className="w-5 h-5 text-orange-400" /> };
    return { text: 'İyi akşamlar', icon: <Coffee className="w-5 h-5 text-violet-400" /> };
}

const PRIORITY_BAR: Record<string, string> = {
    URGENT: 'from-red-500 to-red-700',
    HIGH: 'from-amber-500 to-amber-700',
    MEDIUM: 'from-blue-500 to-blue-700',
    LOW: 'from-zinc-600 to-zinc-800',
};

const PRIORITY_LABEL: Record<string, string> = {
    URGENT: 'Acil', HIGH: 'Yüksek', MEDIUM: 'Orta', LOW: 'Düşük',
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    TODO: { bg: 'bg-zinc-800', text: 'text-zinc-400', label: 'Bekliyor' },
    IN_PROGRESS: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'Devam Ediyor' },
    DONE: { bg: 'bg-emerald-900/30', text: 'text-emerald-400', label: 'Tamamlandı' },
};

function isToday(iso: string | null) {
    if (!iso) return false;
    return dateToKey(iso) === toLocalDateKey(new Date());
}

function isFuture(iso: string | null) {
    if (!iso) return false;
    return new Date(iso) >= new Date(new Date().toDateString());
}

function isThisWeek(iso: string | null) {
    if (!iso) return false;
    const d = new Date(iso);
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
}

function isOverdue(task: TaskResponse) {
    if (task.status === 'DONE') return false;
    if (!task.endDate) return false;
    return dateToKey(task.endDate) < toLocalDateKey(new Date());
}

function formatDateShort(iso: string | null) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function formatTime(t: string | null) {
    if (!t) return null;
    return t.slice(0, 5);
}

/** Format a Date as YYYY-MM-DD in local timezone (avoids UTC shift from toISOString) */
function toLocalDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Convert any date string (ISO instant or YYYY-MM-DD) to local YYYY-MM-DD key */
function dateToKey(iso: string | null): string {
    if (!iso) return '';
    // If it's already YYYY-MM-DD (10 chars, no T), return as-is
    if (iso.length === 10 && !iso.includes('T')) return iso;
    // Otherwise parse as Date and get local key
    return toLocalDateKey(new Date(iso));
}

/** Parse a YYYY-MM-DD key back into a local Date */
function parseLocalDateKey(key: string): Date {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
}

const MOTIVATIONAL = [
    'Her detay, mükemmelliğe giden bir adımdır.',
    'Bugün harika işler çıkaracaksın!',
    'Odaklan, uygula, başar.',
    'Küçük adımlar, büyük sonuçlar.',
    'Yaratıcılık disiplinle buluşunca harikalar olur.',
    'Bugünkü emeğin yarının başarısını getirir.',
    'Sen olmasaydın bu takım eksik olurdu.',
];

/* ─── Components ─── */

function QuickStat({ icon, label, value, accent, delay = 0 }: {
    icon: React.ReactNode; label: string; value: string | number; accent: string; delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.10] transition-all duration-300"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${accent}`}>
                    {icon}
                </div>
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
        </motion.div>
    );
}

function TaskMiniCard({ task, onClick }: { task: TaskResponse; onClick?: () => void }) {
    const badge = STATUS_BADGE[task.status] || STATUS_BADGE.TODO;
    const overdue = isOverdue(task);

    return (
        <div onClick={onClick} className={`flex items-center gap-3 bg-[#111113] border rounded-xl px-4 py-3 transition-colors cursor-pointer ${overdue ? 'border-red-500/20 hover:border-red-500/30' : 'border-white/[0.06] hover:border-emerald-500/20'}`}>
            <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${PRIORITY_BAR[task.priority] || PRIORITY_BAR.LOW}`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    {task.companyName && <span className="text-[10px] text-zinc-600">{task.companyName}</span>}
                    {task.endDate && (
                        <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? 'text-red-400' : 'text-zinc-600'}`}>
                            <Clock className="w-2.5 h-2.5" />
                            {formatDateShort(task.endDate)}
                        </span>
                    )}
                </div>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        </div>
    );
}

function ShootMiniCard({ shoot }: { shoot: ShootResponse }) {
    const today = isToday(shoot.shootDate);
    return (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${today ? 'bg-blue-500/[0.06] border border-blue-500/20' : 'bg-white/[0.02] border border-white/[0.06]'}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${today ? 'bg-blue-500/15' : 'bg-white/[0.04]'}`}>
                <Camera className={`w-3.5 h-3.5 ${today ? 'text-blue-400' : 'text-zinc-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm text-white font-medium truncate">{shoot.title}</span>
                    {today && <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">BUGÜN</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{formatDateShort(shoot.shootDate)}{shoot.shootTime && ` · ${formatTime(shoot.shootTime)}`}</span>
                    {shoot.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{shoot.location}</span>}
                </div>
            </div>
            <span className="text-[10px] text-zinc-600">{shoot.companyName}</span>
        </div>
    );
}

function WeekStrip({ shoots, tasks, meetings, selectedDay, onSelectDay }: {
    shoots: ShootResponse[]; tasks: TaskResponse[]; meetings: MeetingResponse[];
    selectedDay: string | null; onSelectDay: (key: string | null) => void;
}) {
    const days = useMemo(() => {
        const arr = [];
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = toLocalDateKey(d);
            const isCurrent = d.toDateString() === now.toDateString();
            const dayTasks = tasks.filter(t => dateToKey(t.endDate) === key);
            const dayShoots = shoots.filter(s => dateToKey(s.shootDate) === key);
            const dayMeetings = meetings.filter(m => m.meetingDate && dateToKey(m.meetingDate) === key);
            const pendingTasks = dayTasks.filter(t => t.status !== 'DONE');
            const todayKey = toLocalDateKey(new Date());
            const overdueTasks = pendingTasks.filter(t => dateToKey(t.endDate) < todayKey);
            const allDone = dayTasks.length > 0 && pendingTasks.length === 0;
            const hasOverdue = overdueTasks.length > 0;
            arr.push({
                key, dayName: dayNames[i], date: d.getDate(), isCurrent,
                allDone, hasOverdue,
                shootCount: dayShoots.length, taskCount: pendingTasks.length, meetingCount: dayMeetings.length,
            });
        }
        return arr;
    }, [shoots, tasks, meetings]);

    return (
        <div className="grid grid-cols-7 gap-2">
            {days.map((d) => (
                <button
                    key={d.key}
                    onClick={() => onSelectDay(selectedDay === d.key || d.isCurrent ? null : d.key)}
                    className={`relative text-center p-2.5 rounded-xl transition-all cursor-pointer ${
                        selectedDay === d.key
                            ? 'bg-white/[0.06] border-2 border-emerald-500/40 ring-1 ring-emerald-500/20'
                            : d.isCurrent
                                ? d.allDone
                                    ? 'bg-emerald-500/15 border border-emerald-500/30'
                                    : 'bg-emerald-500/10 border border-emerald-500/20'
                                : d.allDone
                                    ? 'bg-emerald-500/[0.06] border border-emerald-500/15'
                                    : 'bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.10]'
                    }`}
                >
                    {/* Overdue red dot */}
                    {d.hasOverdue && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                    )}
                    {/* All done checkmark */}
                    {d.allDone && !d.hasOverdue && (
                        <span className="absolute top-1.5 right-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        </span>
                    )}
                    <p className={`text-[10px] font-semibold ${d.isCurrent ? 'text-emerald-400' : d.allDone ? 'text-emerald-500/70' : 'text-zinc-600'}`}>{d.dayName}</p>
                    <p className={`text-lg font-bold mt-0.5 ${d.isCurrent ? 'text-white' : d.allDone ? 'text-emerald-400/70' : 'text-zinc-400'}`}>{d.date}</p>
                    <div className="flex justify-center mt-1 gap-0.5">
                        {Array.from({ length: Math.min(d.shootCount, 3) }).map((_, j) => (
                            <div key={`s${j}`} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        ))}
                        {Array.from({ length: Math.min(d.taskCount, 3) }).map((_, j) => (
                            <div key={`t${j}`} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        ))}
                        {Array.from({ length: Math.min(d.meetingCount, 3) }).map((_, j) => (
                            <div key={`m${j}`} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        ))}
                    </div>
                </button>
            ))}
        </div>
    );
}

/* ─── Main Page ─── */
export default function KanbanPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const greeting = getGreeting();
    const quote = MOTIVATIONAL[new Date().getDate() % MOTIVATIONAL.length];
    const [newNote, setNewNote] = useState('');
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    // --- Avatar upload ---
    const avatarMutation = useMutation({
        mutationFn: (file: File) => settingsApi.uploadAvatar(file),
        onSuccess: () => {
            // Force re-fetch user info so avatarUrl updates everywhere
            window.location.reload();
        },
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) avatarMutation.mutate(file);
    };

    // --- Data ---
    const { data: myTasksData, isLoading: loadingTasks } = useQuery<PageResponse<TaskResponse>>({
        queryKey: ['my-panel-tasks'],
        queryFn: () => staffApi.getMyTasks(0, 50),
    });

    const { data: shootsData, isLoading: loadingShoots } = useQuery<PageResponse<ShootResponse>>({
        queryKey: ['my-panel-shoots'],
        queryFn: () => staffApi.getShoots(0, 50),
    });

    const { data: meetingsData } = useQuery<PageResponse<MeetingResponse>>({
        queryKey: ['my-panel-meetings'],
        queryFn: () => staffApi.getMeetings(0, 50),
    });

    const { data: prData } = useQuery<PageResponse<PrProjectResponse>>({
        queryKey: ['my-panel-pr'],
        queryFn: () => staffApi.getPrProjects(0, 50),
    });

    const { data: notesData } = useQuery<PageResponse<NoteResponse>>({
        queryKey: ['my-panel-notes'],
        queryFn: () => staffApi.getNotes(0, 10),
    });

    const createNote = useMutation({
        mutationFn: (content: string) => staffApi.createNote({ content }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-panel-notes'] }); setNewNote(''); },
    });

    const toggleNote = useMutation({
        mutationFn: (id: string) => staffApi.toggleNote(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-panel-notes'] }),
    });

    const deleteNote = useMutation({
        mutationFn: (id: string) => staffApi.deleteNote(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-panel-notes'] }),
    });

    const allTasks = myTasksData?.content ?? [];
    const allShoots = shootsData?.content ?? [];
    const allMeetings = meetingsData?.content ?? [];
    const allPr = prData?.content ?? [];
    const notes = notesData?.content ?? [];

    // --- Derived data ---
    const activeTasks = allTasks.filter(t => t.status !== 'DONE');
    const overdueTasks = allTasks.filter(isOverdue);
    const todayTasks = allTasks.filter(t => isToday(t.endDate) && t.status !== 'DONE');
    const urgentTasks = allTasks.filter(t => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'DONE');
    const completedTasks = allTasks.filter(t => t.status === 'DONE');
    const upcomingShoots = allShoots.filter(s => isFuture(s.shootDate) && s.status !== 'CANCELLED').sort((a, b) => new Date(a.shootDate!).getTime() - new Date(b.shootDate!).getTime());
    const todayShoots = allShoots.filter(s => isToday(s.shootDate) && s.status !== 'CANCELLED');
    const upcomingMeetings = allMeetings.filter(m => isFuture(m.meetingDate) && m.status !== 'CANCELLED').sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());
    const activePr = allPr.filter(p => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE');

    const completionRate = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

    const handleTaskStatusChange = async (taskId: string, status: string) => {
        try {
            await staffApi.updateTask(taskId, { status });
            queryClient.invalidateQueries({ queryKey: ['my-panel-tasks'] });
            setSelectedTask(null);
        } catch { }
    };

    const isLoading = loadingTasks || loadingShoots;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-6 w-6 border-2 border-emerald-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {/* ─── Hero Greeting ─── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#111113] to-[#0a0a0c] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-start gap-5">
                    {/* Avatar */}
                    <div className="relative shrink-0 group">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover border-2 border-white/[0.08]" />
                        ) : (
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold border-2 border-white/[0.08]">
                                {user?.fullName?.charAt(0) || 'S'}
                            </div>
                        )}
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={avatarMutation.isPending}
                            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Pencil className="w-3 h-3" />
                        </button>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {greeting.icon}
                            <span className="text-sm text-zinc-500">{greeting.text}</span>
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            {user?.fullName ?? 'Kullanıcı'}
                        </h1>
                        <p className="text-sm text-zinc-600 mt-1 italic">"{quote}"</p>

                    {/* Today summary */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {todayShoots.length > 0 && (
                            <div className="flex items-center gap-2 bg-blue-500/[0.08] border border-blue-500/20 rounded-xl px-3 py-2">
                                <Camera className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs text-blue-300"><strong>{todayShoots.length}</strong> çekim bugün</span>
                            </div>
                        )}
                        {todayTasks.length > 0 && (
                            <div className="flex items-center gap-2 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl px-3 py-2">
                                <Target className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-xs text-amber-300"><strong>{todayTasks.length}</strong> görev bugün bitmeli</span>
                            </div>
                        )}
                        {overdueTasks.length > 0 && (
                            <div className="flex items-center gap-2 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3 py-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                <span className="text-xs text-red-300"><strong>{overdueTasks.length}</strong> gecikmiş görev</span>
                            </div>
                        )}
                        {todayShoots.length === 0 && todayTasks.length === 0 && overdueTasks.length === 0 && (
                            <div className="flex items-center gap-2 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl px-3 py-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-xs text-emerald-300">Bugün için acil bir şey yok, rahat çalışabilirsin!</span>
                            </div>
                        )}
                    </div>
                    </div>
                </div>
            </motion.div>

            {/* ─── Quick Stats ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <QuickStat icon={<Flame className="w-4 h-4 text-red-400" />} label="Acil / Yüksek" value={urgentTasks.length} accent="bg-red-500/10" delay={0} />
                <QuickStat icon={<Target className="w-4 h-4 text-blue-400" />} label="Aktif Görev" value={activeTasks.length} accent="bg-blue-500/10" delay={0.05} />
                <QuickStat icon={<Camera className="w-4 h-4 text-violet-400" />} label="Yaklaşan Çekim" value={upcomingShoots.length} accent="bg-violet-500/10" delay={0.1} />
                <QuickStat icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} label="Tamamlama" value={`%${completionRate}`} accent="bg-emerald-500/10" delay={0.15} />
            </div>

            {/* ─── Week Strip ─── */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    Haftalık Görünüm
                    <span className="text-[10px] text-zinc-600 ml-auto flex items-center gap-2">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Çekim</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Görev</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Toplantı</span>
                    </span>
                </h3>
                <WeekStrip shoots={allShoots} tasks={allTasks} meetings={allMeetings} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ─── Urgent / Overdue Tasks ─── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Flame className="w-4 h-4 text-red-400" />
                            {selectedDay ? (() => { return `${parseLocalDateKey(selectedDay).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })} — Görevler`; })() : 'Öncelikli Görevler'}
                        </h2>
                        <div className="flex items-center gap-2">
                            {selectedDay && (
                                <button onClick={() => setSelectedDay(null)} className="text-zinc-500 hover:text-zinc-300 text-[10px] bg-white/[0.04] px-2 py-0.5 rounded-md transition-colors">
                                    Genel Görünüm
                                </button>
                            )}
                            <Link to="/staff/tasks" className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-0.5 transition-colors">
                                Tümü <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                    {selectedDay ? (() => {
                        const dayTasks = allTasks.filter(t => dateToKey(t.endDate) === selectedDay);
                        const dayOverdue = dayTasks.filter(t => t.status !== 'DONE' && dateToKey(t.endDate) < toLocalDateKey(new Date()));
                        const dayPending = dayTasks.filter(t => t.status !== 'DONE' && !dayOverdue.includes(t));
                        const dayDone = dayTasks.filter(t => t.status === 'DONE');
                        const hasAny = dayTasks.length > 0;

                        if (!hasAny) return (
                            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 text-center">
                                <CheckCircle2 className="w-8 h-8 text-zinc-700/30 mx-auto mb-2" />
                                <p className="text-xs text-zinc-600">Bu gün için görev yok</p>
                            </div>
                        );

                        return (
                            <div className="space-y-3">
                                {/* Day summary banner */}
                                {dayDone.length === dayTasks.length ? (
                                    <div className="flex items-center gap-2 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl px-3 py-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-xs text-emerald-300">Tüm görevler tamamlandı!</span>
                                    </div>
                                ) : dayOverdue.length > 0 ? (
                                    <div className="flex items-center gap-2 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3 py-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                        <span className="text-xs text-red-300"><strong>{dayOverdue.length}</strong> gecikmiş görev var</span>
                                    </div>
                                ) : null}

                                {/* Overdue */}
                                {dayOverdue.map(task => (
                                    <div key={task.id} onClick={() => setSelectedTask(task)} className="flex items-center gap-3 bg-red-500/[0.06] border border-red-500/15 rounded-xl px-4 py-3 cursor-pointer hover:border-red-500/30 transition-colors">
                                        <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${PRIORITY_BAR[task.priority] || PRIORITY_BAR.LOW}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium truncate">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {task.companyName && <span className="text-[10px] text-zinc-600">{task.companyName}</span>}
                                                {task.endTime && <span className="text-[10px] text-zinc-500 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{formatTime(task.endTime)}</span>}
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">GECİKMİŞ</span>
                                    </div>
                                ))}

                                {/* Pending */}
                                {dayPending.map(task => (
                                    <TaskMiniCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                                ))}

                                {/* Done */}
                                {dayDone.map(task => (
                                    <div key={task.id} onClick={() => setSelectedTask(task)} className="flex items-center gap-3 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl px-4 py-3 cursor-pointer hover:border-emerald-500/20 transition-colors opacity-60">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <p className="text-sm text-zinc-400 font-medium truncate line-through flex-1">{task.title}</p>
                                        {task.companyName && <span className="text-[10px] text-zinc-600">{task.companyName}</span>}
                                    </div>
                                ))}
                            </div>
                        );
                    })() : (
                        [...overdueTasks, ...urgentTasks.filter(t => !isOverdue(t))].length === 0 ? (
                            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 text-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
                                <p className="text-xs text-zinc-600">Acil veya gecikmiş görev yok</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {[...overdueTasks, ...urgentTasks.filter(t => !isOverdue(t))].slice(0, 5).map(task => (
                                    <TaskMiniCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* ─── Shoots & Meetings for selected day, or default ─── */}
                <div className="space-y-4">
                    {selectedDay ? (() => {
                        const dayShoots = allShoots.filter(s => dateToKey(s.shootDate) === selectedDay);
                        const dayMeetings = allMeetings.filter(m => m.meetingDate && dateToKey(m.meetingDate) === selectedDay);
                        const hasAny = dayShoots.length > 0 || dayMeetings.length > 0;

                        return (
                            <>
                                {/* Day Shoots */}
                                <div className="space-y-3">
                                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-blue-400" />
                                        Çekimler
                                        {dayShoots.length > 0 && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">{dayShoots.length}</span>}
                                    </h2>
                                    {dayShoots.length === 0 ? (
                                        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-4 text-center">
                                            <Camera className="w-6 h-6 text-zinc-700/30 mx-auto mb-1" />
                                            <p className="text-xs text-zinc-600">Bu gün çekim yok</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {dayShoots.map(shoot => <ShootMiniCard key={shoot.id} shoot={shoot} />)}
                                        </div>
                                    )}
                                </div>

                                {/* Day Meetings */}
                                <div className="space-y-3">
                                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Users className="w-4 h-4 text-cyan-400" />
                                        Toplantılar
                                        {dayMeetings.length > 0 && <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-md">{dayMeetings.length}</span>}
                                    </h2>
                                    {dayMeetings.length === 0 ? (
                                        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-4 text-center">
                                            <Users className="w-6 h-6 text-zinc-700/30 mx-auto mb-1" />
                                            <p className="text-xs text-zinc-600">Bu gün toplantı yok</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {dayMeetings.map(m => (
                                                <div key={m.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                                                    <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                                                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white font-medium truncate">{m.title}</p>
                                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                                                            {m.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{m.location}</span>}
                                                            {m.durationMinutes && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{m.durationMinutes} dk</span>}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-zinc-600">{m.companyName || 'Ajans İçi'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })() : (
                        /* Default: Upcoming Shoots */
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-blue-400" />
                                    Yaklaşan Çekimler
                                </h2>
                                <Link to="/staff/shoots" className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-0.5 transition-colors">
                                    Tümü <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                            {upcomingShoots.length === 0 ? (
                                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 text-center">
                                    <Camera className="w-8 h-8 text-zinc-700/30 mx-auto mb-2" />
                                    <p className="text-xs text-zinc-600">Yaklaşan çekim yok</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {upcomingShoots.slice(0, 5).map(shoot => (
                                        <ShootMiniCard key={shoot.id} shoot={shoot} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ─── Meetings & PR — only in default (non-day) view ─── */}
            {!selectedDay && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ─── Upcoming Meetings ─── */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        Yaklaşan Toplantılar
                    </h2>
                    {upcomingMeetings.length === 0 ? (
                        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 text-center">
                            <Users className="w-8 h-8 text-zinc-700/30 mx-auto mb-2" />
                            <p className="text-xs text-zinc-600">Planlanmış toplantı yok</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {upcomingMeetings.slice(0, 4).map(m => (
                                <div key={m.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                                    <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium truncate">{m.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                                            <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{formatDateShort(m.meetingDate)}</span>
                                            {m.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{m.location}</span>}
                                            {m.durationMinutes && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{m.durationMinutes} dk</span>}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-zinc-600">{m.companyName}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── Active PR Projects ─── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Rocket className="w-4 h-4 text-pink-400" />
                            Aktif Projeler
                        </h2>
                        <Link to="/staff/pr" className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-0.5 transition-colors">
                            Tümü <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {activePr.length === 0 ? (
                        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 text-center">
                            <Rocket className="w-8 h-8 text-zinc-700/30 mx-auto mb-2" />
                            <p className="text-xs text-zinc-600">Aktif proje yok</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {activePr.slice(0, 4).map(pr => (
                                <Link key={pr.id} to="/staff/pr" className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 hover:border-white/[0.10] transition-colors">
                                    <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                                        <Rocket className="w-3.5 h-3.5 text-pink-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium truncate">{pr.name}</p>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">{pr.companyName} · Faz {pr.currentPhase}/{pr.totalPhases}</p>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-16 shrink-0">
                                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all" style={{ width: `${pr.progressPercent}%` }} />
                                        </div>
                                        <p className="text-[9px] text-zinc-600 text-right mt-0.5">%{pr.progressPercent}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            )}

            {/* ─── Quick Notes ─── */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-amber-400" />
                    Hızlı Notlar
                </h3>
                <div className="flex gap-2">
                    <input
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && newNote.trim()) createNote.mutate(newNote.trim()); }}
                        placeholder="Not ekle..."
                        className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/30 transition-colors"
                    />
                    <button
                        onClick={() => { if (newNote.trim()) createNote.mutate(newNote.trim()); }}
                        disabled={!newNote.trim() || createNote.isPending}
                        className="px-3 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 disabled:opacity-40 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {notes.length === 0 ? (
                    <p className="text-center text-zinc-600 text-xs py-4">Henüz not yok</p>
                ) : (
                    <div className="space-y-1">
                        <AnimatePresence mode="popLayout">
                            {notes.map(n => (
                                <motion.div key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 px-3 py-2 rounded-lg group hover:bg-white/[0.02]">
                                    <button onClick={() => toggleNote.mutate(n.id)} className="shrink-0">
                                        {n.isOpen ? <Circle className="w-3.5 h-3.5 text-zinc-600" /> : <CircleCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                    </button>
                                    <span className={`flex-1 text-sm ${n.isOpen ? 'text-zinc-300' : 'text-zinc-600 line-through'}`}>{n.content}</span>
                                    {n.companyName && <span className="text-[9px] text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded">{n.companyName}</span>}
                                    <button onClick={() => deleteNote.mutate(n.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="w-3 h-3" />
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
                onStatusChange={handleTaskStatusChange}
            />
        </div>
    );
}
