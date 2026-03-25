import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { staffApi, type TaskResponse, type PageResponse } from '../../api/staff';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    ListTodo, AlertTriangle, Clock
} from 'lucide-react';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const PRIORITY_DOT: Record<string, string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-emerald-500',
};

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

export default function StaffCalendarPage() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const { data } = useQuery<PageResponse<TaskResponse>>({
        queryKey: ['calendar-tasks'],
        queryFn: () => staffApi.getAllTasks(0, 200),
    });

    const tasksByDate = useMemo(() => {
        const map: Record<string, TaskResponse[]> = {};
        data?.content?.forEach(task => {
            if (task.dueDate) {
                const key = task.dueDate.slice(0, 10);
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
    const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

    const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Takvim</h1>
                    <p className="text-zinc-600 text-sm mt-1">Aylık görev ve etkinlik takvimi</p>
                </div>
                <button onClick={goToday}
                    className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                    Bugün
                </button>
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
                            const tasks = tasksByDate[key] || [];

                            return (
                                <button key={i}
                                    onClick={() => setSelectedDate(isSelected ? null : key)}
                                    className={`relative p-2 min-h-[72px] border-b border-r border-white/[0.03] text-left transition-all ${!currentMonth ? 'opacity-30' :
                                        isSelected ? 'bg-emerald-500/10' :
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

            {/* Selected date tasks */}
            {selectedDate && (
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', {
                            weekday: 'long', day: 'numeric', month: 'long'
                        })}
                    </h3>

                    {selectedTasks.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-4">Bu tarihte görev yok</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedTasks.map(task => (
                                <div key={task.id}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                                        task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                                            'bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                        {task.priority === 'HIGH' ? <AlertTriangle className="w-4 h-4" /> : <ListTodo className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-zinc-600">{task.companyName}</span>
                                            {task.dueTime && (
                                                <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                                                    <Clock className="w-2.5 h-2.5" /> {task.dueTime}
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
                    <div className="h-2 w-2 rounded-full bg-red-500" /> Yüksek Öncelik
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-amber-500" /> Orta Öncelik
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" /> Düşük Öncelik
                </div>
            </div>
        </div>
    );
}
