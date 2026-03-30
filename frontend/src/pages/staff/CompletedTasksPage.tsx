import { useEffect, useState } from 'react';
import { staffApi } from '../../api/staff';
import type { TaskResponse } from '../../api/staff';
import { motion } from 'framer-motion';
import { CheckCircle2, Star } from 'lucide-react';

export default function CompletedTasksPage() {
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        staffApi.getAllTasks(0, 50, 'DONE')
            .then(data => setTasks(data.content))
            .catch(() => setTasks([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Tamamlanan Görevler</h1>
                <p className="text-zinc-600 text-sm mt-1">Başarıyla tamamlanan görevler</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-zinc-600">Yükleniyor...</div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-20 bg-[#111113]/80 border border-white/[0.06] rounded-2xl">
                    <Star className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">Henüz tamamlanan görev yok.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.map((task, i) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4"
                        >
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-white/80 font-medium text-sm line-through">{task.title}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    {task.companyName && <span className="text-zinc-600 text-xs">{task.companyName}</span>}
                                    {task.assignedToName && <span className="text-zinc-700 text-xs">{task.assignedToName}</span>}
                                    {task.completedAt && (
                                        <span className="text-zinc-700 text-[10px]">
                                            {new Date(task.completedAt).toLocaleDateString('tr-TR')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase bg-emerald-900/30 text-emerald-400">
                                Tamamlandı
                            </span>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
