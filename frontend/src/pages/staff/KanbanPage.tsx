import { useEffect, useState } from 'react';
import { staffApi } from '../../api/staff';
import type { TaskResponse } from '../../api/staff';
import KanbanBoard from '../../components/KanbanBoard';
import { Loader2, LayoutGrid } from 'lucide-react';

export default function KanbanPage() {
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTasks = () => {
        staffApi.getAllTasks(0, 100)
            .then(data => setTasks(data.content))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadTasks(); }, []);

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            await staffApi.updateTask(taskId, { status: newStatus });
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (err) {
            console.error('Status update failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <LayoutGrid className="w-6 h-6 text-emerald-400" />
                    Kanban Panosu
                </h1>
                <p className="text-sm text-zinc-500 mt-1">Görevleri sürükle-bırak ile yönetin</p>
            </div>

            <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
        </div>
    );
}
