import { useQuery } from '@tanstack/react-query';
import { clientApi } from '../../api/clientPanel';
import type { TaskResponse, PageResponse } from '../../api/staff';
import { ListTodo, AlertTriangle, Calendar } from 'lucide-react';

const PRIORITY_STYLES: Record<string, string> = {
    HIGH: 'text-red-400 bg-red-500/10',
    MEDIUM: 'text-amber-400 bg-amber-500/10',
    LOW: 'text-emerald-400 bg-emerald-500/10',
};

const STATUS_LABELS: Record<string, string> = {
    TODO: 'Bekliyor',
    IN_PROGRESS: 'Devam Ediyor',
    DONE: 'Tamamlandı',
    OVERDUE: 'Gecikmiş',
};

export default function ClientTasksPage() {
    const { data, isLoading } = useQuery<PageResponse<TaskResponse>>({
        queryKey: ['client-tasks'],
        queryFn: () => clientApi.getMyTasks(0, 50),
    });

    const tasks = data?.content?.filter(t => t.status !== 'DONE') || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Yapılacaklar</h1>
                <p className="text-sm text-zinc-500 mt-1">Bekleyen görevleriniz</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <ListTodo className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">Bekleyen görev yok</h3>
                    <p className="text-sm text-zinc-500 mt-1">Tüm görevleriniz tamamlanmış</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <div key={task.id} className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-start gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${PRIORITY_STYLES[task.priority] || 'bg-[#18181b] text-zinc-500'}`}>
                                    {task.priority === 'HIGH' ? <AlertTriangle className="w-4 h-4" /> : <ListTodo className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-white">{task.title}</h3>
                                    {task.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>}
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${PRIORITY_STYLES[task.priority] || ''}`}>
                                            {task.priority}
                                        </span>
                                        <span className="text-xs text-zinc-600">{STATUS_LABELS[task.status] || task.status}</span>
                                        {task.endDate && (
                                            <span className="flex items-center gap-1 text-xs text-zinc-600">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(task.endDate).toLocaleDateString('tr-TR')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
