import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../../api/clientPanel';
import type { TaskResponse, PageResponse, TaskReviewResponse } from '../../api/staff';
import { CheckCircle2, Calendar, Star, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ClientCompletedPage() {
    const queryClient = useQueryClient();
    const [reviewTarget, setReviewTarget] = useState<TaskResponse | null>(null);
    const [score, setScore] = useState(0);
    const [hoverScore, setHoverScore] = useState(0);
    const [comment, setComment] = useState('');

    const { data, isLoading } = useQuery<PageResponse<TaskResponse>>({
        queryKey: ['client-completed'],
        queryFn: () => clientApi.getMyTasks(0, 50, 'DONE'),
    });

    // Fetch reviews for all tasks so we know which are already reviewed
    const { data: reviewsMap } = useQuery({
        queryKey: ['client-task-reviews'],
        queryFn: async () => {
            const tasks = data?.content || [];
            const map: Record<string, TaskReviewResponse[]> = {};
            await Promise.all(tasks.map(async t => {
                try { map[t.id] = await clientApi.getTaskReviews(t.id); } catch { map[t.id] = []; }
            }));
            return map;
        },
        enabled: !!data && data.content.length > 0,
    });

    const reviewMutation = useMutation({
        mutationFn: () => clientApi.reviewTask(reviewTarget!.id, { score, comment: comment || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client-task-reviews'] });
            setReviewTarget(null);
            setScore(0);
            setComment('');
        },
    });

    const completedTasks = data?.content || [];

    const openReview = (task: TaskResponse) => {
        setReviewTarget(task);
        setScore(0);
        setHoverScore(0);
        setComment('');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Yapılan Görevler</h1>
                <p className="text-sm text-zinc-500 mt-1">Tamamlanmış görevler ve puanlama</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full" />
                </div>
            ) : completedTasks.length === 0 ? (
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">Tamamlanan görev yok</h3>
                    <p className="text-sm text-zinc-500 mt-1">Tamamlanan görevler burada listelenecek</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {completedTasks.map((task) => {
                        const reviews = reviewsMap?.[task.id] || [];
                        const alreadyReviewed = reviews.length > 0;
                        const avgScore = alreadyReviewed ? reviews.reduce((s, r) => s + r.score, 0) / reviews.length : 0;

                        return (
                            <div key={task.id} className="bg-[#0C0C0E] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-pink-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-white">{task.title}</h3>
                                        {task.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>}
                                        <div className="flex items-center gap-3 mt-2">
                                            {task.completedAt && (
                                                <span className="flex items-center gap-1 text-xs text-zinc-600">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(task.completedAt).toLocaleDateString('tr-TR')}
                                                </span>
                                            )}
                                            <span className="text-xs text-zinc-600">{task.category}</span>
                                        </div>
                                    </div>
                                    {alreadyReviewed ? (
                                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 text-xs font-medium">
                                            <Star className="w-3 h-3 fill-current" />
                                            {avgScore.toFixed(1)}
                                        </div>
                                    ) : (
                                        <button onClick={() => openReview(task)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors">
                                            <Star className="w-3 h-3" />
                                            Puanla
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Review Modal */}
            <AnimatePresence>
                {reviewTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#0C0C0E] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Görevi Puanla</h2>
                                <button onClick={() => setReviewTarget(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <p className="text-sm text-zinc-400">{reviewTarget.title}</p>
                            <div className="flex items-center justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button
                                        key={s}
                                        onMouseEnter={() => setHoverScore(s)}
                                        onMouseLeave={() => setHoverScore(0)}
                                        onClick={() => setScore(s)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star className={`w-8 h-8 ${(hoverScore || score) >= s ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                placeholder="Yorum (opsiyonel)"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                rows={3}
                                className="w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white resize-none"
                            />
                            <button
                                disabled={score === 0 || reviewMutation.isPending}
                                onClick={() => reviewMutation.mutate()}
                                className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                            >
                                {reviewMutation.isPending ? 'Gönderiliyor...' : 'Puanla'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
