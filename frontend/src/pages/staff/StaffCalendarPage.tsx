import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { staffApi, type TaskResponse, type PageResponse, type TaskNoteResponse } from '../../api/staff';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    AlertTriangle, Clock, User, Building2, X, MessageSquare, Send, Trash2, Tag, Flag, ChevronRight as ChevronRightIcon
} from 'lucide-react';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const PRIORITY_DOT: Record<string, string> = {
    URGENT: 'bg-red-500',
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-emerald-500',
};

const CATEGORY_ICON: Record<string, string> = {
    TOPLANTI: '📅',
    REELS: '🎬',
    BLOG: '✍️',
    PAYLASIM: '📢',
    SEO: '🔍',
    TASARIM: '🎨',
    OTHER: '📌',
};

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

function getMonthDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday = 0, Sunday = 6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: { date: Date; currentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startDow - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        days.push({ date: d, currentMonth: false });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push({ date: new Date(year, month, i), currentMonth: true });
    }

    // Next month padding
    while (days.length % 7 !== 0) {
        const nextDate = new Date(year, month + 1, days.length - lastDay.getDate() - startDow + 1);
        days.push({ date: nextDate, currentMonth: false });
    }

    return days;
}

function formatDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateRange(start: string, end: string): string[] {
    const keys: string[] = [];
    const s = new Date(start);
    const e = new Date(end);
    const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    const endDate = new Date(e.getFullYear(), e.getMonth(), e.getDate());
    while (cur <= endDate) {
        keys.push(formatDateKey(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return keys;
}

type QuickFilter = 'none' | 'today' | 'week' | 'month';

function getWeekRange(date: Date): [string, string] {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diffMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffMon);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
    return [formatDateKey(mon), formatDateKey(sun)];
}

function getMonthRange(date: Date): [string, string] {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return [formatDateKey(first), formatDateKey(last)];
}

function isDateInRange(dateKey: string, start: string, end: string): boolean {
    return dateKey >= start && dateKey <= end;
}

export default function StaffCalendarPage() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('none');
    const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
    const [notes, setNotes] = useState<TaskNoteResponse[]>([]);
    const [noteText, setNoteText] = useState('');
    const [noteLoading, setNoteLoading] = useState(false);

    const openDetail = useCallback(async (task: TaskResponse) => {
        setSelectedTask(task);
        setNotes([]);
        setNoteText('');
        try {
            const data = await staffApi.getTaskNotes(task.id);
            setNotes(data);
        } catch { }
    }, []);

    const handleAddNote = useCallback(async () => {
        if (!noteText.trim() || !selectedTask) return;
        setNoteLoading(true);
        try {
            const note = await staffApi.addTaskNote(selectedTask.id, noteText.trim());
            setNotes(prev => [note, ...prev]);
            setNoteText('');
        } catch { }
        setNoteLoading(false);
    }, [noteText, selectedTask]);

    const handleDeleteNote = useCallback(async (noteId: string) => {
        try {
            await staffApi.deleteTaskNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch { }
    }, []);

    const { data } = useQuery<PageResponse<TaskResponse>>({
        queryKey: ['calendar-tasks'],
        queryFn: () => staffApi.getAllTasks(0, 200),
    });

    const tasksByDate = useMemo(() => {
        const map: Record<string, TaskResponse[]> = {};
        data?.content?.forEach(task => {
            const start = task.startDate;
            const end = task.endDate;
            if (start && end) {
                const keys = dateRange(start, end);
                keys.forEach(key => {
                    if (!map[key]) map[key] = [];
                    if (!map[key].find(t => t.id === task.id)) map[key].push(task);
                });
            } else if (start) {
                const key = start.slice(0, 10);
                if (!map[key]) map[key] = [];
                map[key].push(task);
            } else if (end) {
                const key = end.slice(0, 10);
                if (!map[key]) map[key] = [];
                map[key].push(task);
            }
        });
        return map;
    }, [data]);

    const days = useMemo(() => getMonthDays(year, month), [year, month]);
    const todayKey = formatDateKey(today);

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };
    const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setQuickFilter('today'); setSelectedDate(null); };

    const handleQuickFilter = (f: QuickFilter) => {
        setQuickFilter(f === quickFilter ? 'none' : f);
        setSelectedDate(null);
        if (f !== quickFilter) {
            setYear(today.getFullYear());
            setMonth(today.getMonth());
        }
    };

    const handleDateClick = (key: string, isSelected: boolean) => {
        setSelectedDate(isSelected ? null : key);
        setQuickFilter('none');
    };

    // Compute filtered tasks based on quickFilter or selectedDate
    const filteredTasks = useMemo(() => {
        if (selectedDate) {
            return (tasksByDate[selectedDate] || []).slice().sort((a, b) => {
                const ta = a.startTime || '99:99';
                const tb = b.startTime || '99:99';
                return ta.localeCompare(tb);
            });
        }
        if (quickFilter === 'none') return [];

        const todayKey = formatDateKey(today);
        let rangeStart: string, rangeEnd: string;
        if (quickFilter === 'today') {
            rangeStart = todayKey;
            rangeEnd = todayKey;
        } else if (quickFilter === 'week') {
            [rangeStart, rangeEnd] = getWeekRange(today);
        } else {
            [rangeStart, rangeEnd] = getMonthRange(today);
        }

        const seen = new Set<number>();
        const result: TaskResponse[] = [];
        Object.entries(tasksByDate).forEach(([key, tasks]) => {
            if (isDateInRange(key, rangeStart, rangeEnd)) {
                tasks.forEach(t => {
                    if (!seen.has(t.id)) {
                        seen.add(t.id);
                        result.push(t);
                    }
                });
            }
        });
        return result.sort((a, b) => {
            const da = a.startDate || '';
            const db = b.startDate || '';
            if (da !== db) return da.localeCompare(db);
            const ta = a.startTime || '99:99';
            const tb = b.startTime || '99:99';
            return ta.localeCompare(tb);
        });
    }, [selectedDate, quickFilter, tasksByDate]);

    const filterLabel = useMemo(() => {
        if (selectedDate) {
            return new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
        }
        if (quickFilter === 'today') return 'Bugün';
        if (quickFilter === 'week') return 'Bu Hafta';
        if (quickFilter === 'month') return 'Bu Ay';
        return '';
    }, [selectedDate, quickFilter]);

    // Highlight range on calendar
    const highlightRange = useMemo<[string, string] | null>(() => {
        if (quickFilter === 'today') {
            const k = formatDateKey(today);
            return [k, k];
        }
        if (quickFilter === 'week') return getWeekRange(today);
        if (quickFilter === 'month') return getMonthRange(today);
        return null;
    }, [quickFilter]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Takvim</h1>
                    <p className="text-zinc-600 text-sm mt-1">Aylık görev ve etkinlik takvimi</p>
                </div>
                <div className="flex items-center gap-2">
                    {(['today', 'week', 'month'] as QuickFilter[]).map(f => {
                        const label = f === 'today' ? 'Bugün' : f === 'week' ? 'Bu Hafta' : 'Bu Ay';
                        const isActive = quickFilter === f;
                        return (
                            <button key={f} onClick={() => handleQuickFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                }`}>
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden">
                {/* Month navigation */}
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-white">
                        {MONTHS[month]} {year}
                    </h2>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Day headers */}
                <div className="overflow-x-auto">
                    <div className="grid grid-cols-7 border-b border-white/[0.06] min-w-[500px]">
                        {DAYS.map(day => (
                            <div key={day} className="p-2 text-center text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 min-w-[500px]">
                        {days.map(({ date, currentMonth }, i) => {
                            const key = formatDateKey(date);
                            const isToday = key === todayKey;
                            const isSelected = key === selectedDate;
                            const isInRange = highlightRange ? isDateInRange(key, highlightRange[0], highlightRange[1]) : false;
                            const tasks = tasksByDate[key] || [];

                            return (
                                <button key={i}
                                    onClick={() => handleDateClick(key, isSelected)}
                                    className={`relative p-2 min-h-[72px] border-b border-r border-white/[0.03] text-left transition-all ${!currentMonth ? 'opacity-30' :
                                        isSelected ? 'bg-emerald-500/10' :
                                            isInRange ? 'bg-emerald-500/5' :
                                                isToday ? 'bg-white/[0.03]' :
                                                    'hover:bg-white/[0.02]'
                                        }`}>
                                    <span className={`text-xs font-medium ${isToday ? 'bg-emerald-500 text-white px-1.5 py-0.5 rounded-md' :
                                        isSelected ? 'text-emerald-400' :
                                            currentMonth ? 'text-zinc-400' : 'text-zinc-700'
                                        }`}>
                                        {date.getDate()}
                                    </span>

                                    {/* Task dots */}
                                    {tasks.length > 0 && (
                                        <div className="flex gap-0.5 mt-1 flex-wrap">
                                            {tasks.slice(0, 3).map((task, ti) => (
                                                <div key={ti}
                                                    className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority] || 'bg-zinc-600'}`}
                                                    title={task.title} />
                                            ))}
                                            {tasks.length > 3 && (
                                                <span className="text-[8px] text-zinc-600 ml-0.5">+{tasks.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filtered tasks */}
            {(selectedDate || quickFilter !== 'none') && (
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            {filterLabel}
                            <span className="text-emerald-400 normal-case">({filteredTasks.length} görev)</span>
                        </h3>
                    </div>

                    {filteredTasks.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-4">Bu aralıkta görev yok</p>
                    ) : (
                        <div className="space-y-2">
                            {filteredTasks.map(task => (
                                <div key={task.id}
                                    onClick={() => openDetail(task)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-500/10 text-red-400' :
                                        task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                                            'bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                        {task.priority === 'HIGH' || task.priority === 'URGENT' ? <AlertTriangle className="w-4 h-4" /> :
                                         <span>{CATEGORY_ICON[task.category] || '📌'}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-white truncate">{task.title}</p>
                                            {(() => {
                                                const rem = getRemainingTime(task);
                                                if (!rem) return null;
                                                return <span className={`text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] font-bold ${rem.color}`}>⏱ {rem.text}</span>;
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            {quickFilter !== 'none' && !selectedDate && task.startDate && (
                                                <span className="text-[10px] text-emerald-400/70 flex items-center gap-0.5">
                                                    <CalendarIcon className="w-2.5 h-2.5" />
                                                    {new Date(task.startDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                    {task.endDate && task.endDate !== task.startDate && (' – ' + new Date(task.endDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }))}
                                                </span>
                                            )}
                                            {task.companyName && (
                                                <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                                                    <Building2 className="w-2.5 h-2.5" /> {task.companyName}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                                                <User className="w-2.5 h-2.5" /> {task.assignedToName}
                                            </span>
                                            {(task.startTime || task.endTime) && (
                                                <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                                                    <Clock className="w-2.5 h-2.5" /> {task.startTime?.slice(0,5)}{task.startTime && task.endTime && ' - '}{task.endTime?.slice(0,5)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${task.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400' :
                                        task.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-[#18181b] text-zinc-500'
                                        }`}>
                                        {task.status === 'DONE' ? 'Tamam' : task.status === 'IN_PROGRESS' ? 'Devam' : 'Bekliyor'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-zinc-600">
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500" /> Yüksek/Acil
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-amber-500" /> Orta
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" /> Düşük
                </div>
            </div>

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
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Tarih & Saat</p>
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
                                                <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
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
        </div>
    );
}
