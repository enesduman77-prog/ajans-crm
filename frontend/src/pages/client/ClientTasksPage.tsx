import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { clientApi } from '../../api/clientPanel';
import type { TaskResponse, PageResponse, TaskReviewResponse } from '../../api/staff';
import {
    ListTodo, CheckCircle2, Clock, AlertCircle, Calendar,
    Star, X, ChevronRight, User, Loader2,
} from 'lucide-react';

// ─── Sabitler ────────────────────────────────────────────────────────────────

type Tab = 'all' | 'active' | 'done';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'Tümü', icon: ListTodo },
    { key: 'active', label: 'Devam Eden', icon: Clock },
    { key: 'done', label: 'Tamamlandı', icon: CheckCircle2 },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    TODO:        { label: 'Bekliyor',       color: 'text-zinc-400',    bg: 'bg-zinc-700/40',      icon: ListTodo },
    IN_PROGRESS: { label: 'Devam Ediyor',   color: 'text-blue-400',    bg: 'bg-blue-500/10',      icon: Clock },
    DONE:        { label: 'Tamamlandı',     color: 'text-emerald-400', bg: 'bg-emerald-500/10',   icon: CheckCircle2 },
    OVERDUE:     { label: 'Gecikmiş',       color: 'text-red-400',     bg: 'bg-red-500/10',       icon: AlertCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
    GENERAL: 'Genel', DESIGN: 'Tasarım', DEVELOPMENT: 'Geliştirme',
    CONTENT: 'İçerik', MARKETING: 'Pazarlama', MEETING: 'Toplantı',
    REPORTING: 'Raporlama', OTHER: 'Diğer',
};

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({
    task, reviews, onReview, delay,
}: {
    task: TaskResponse;
    reviews?: TaskReviewResponse[];
    onReview: (t: TaskResponse) => void;
    delay: number;
}) {
    const meta = STATUS_META[task.status] ?? STATUS_META.TODO;
    const Icon = meta.icon;
    const isDone = task.status === 'DONE';
    const alreadyReviewed = (reviews?.length ?? 0) > 0;
    const avgScore = alreadyReviewed
        ? reviews!.reduce((s, r) => s + r.score, 0) / reviews!.length
        : 0;
    const isOverdue = task.status === 'OVERDUE';

    const endDate = task.endDate ? new Date(task.endDate) : null;
    const completedAt = task.completedAt ? new Date(task.completedAt) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.04 }}
            className={`bg-[#0C0C0E] border rounded-2xl p-4 hover:border-white/10 transition-colors ${
                isOverdue ? 'border-red-500/20' : 'border-white/[0.06]'
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className={`text-sm font-semibold leading-snug ${isDone ? 'text-zinc-400 line-through decoration-zinc-600' : 'text-white'}`}>
                            {task.title}
                        </h3>
                        {/* Badge */}
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${meta.bg} ${meta.color}`}>
                            {meta.label}
                        </span>
                    </div>

                    {task.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                        {/* Assigned to */}
                        {task.assignedToName && (
                            <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                                <User className="w-3 h-3" />
                                {task.assignedToName}
                            </span>
                        )}
                        {/* Category */}
                        {task.category && (
                            <span className="text-[11px] text-zinc-600">
                                {CATEGORY_LABELS[task.category] ?? task.category}
                            </span>
                        )}
                        {/* Deadline */}
                        {!isDone && endDate && (
                            <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-red-400' : 'text-zinc-500'}`}>
                                <Calendar className="w-3 h-3" />
                                {endDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                            </span>
                        )}
                        {/* Completed date */}
                        {isDone && completedAt && (
                            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                                <CheckCircle2 className="w-3 h-3" />
                                {completedAt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>

                {/* Review section (only for DONE) */}
                {isDone && (
                    <div className="flex-shrink-0">
                        {alreadyReviewed ? (
                            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold">
                                <Star className="w-3 h-3 fill-current" />
                                {avgScore.toFixed(1)}
                            </div>
                        ) : (
                            <button
                                onClick={() => onReview(task)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-amber-400 hover:border-amber-500/20 hover:bg-amber-500/5 text-xs transition-all"
                            >
                                <Star className="w-3 h-3" /> Puanla
                            </button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ tab }: { tab: Tab }) {
    const msgs: Record<Tab, { title: string; sub: string; icon: React.ElementType }> = {
        all:    { title: 'Henüz görev yok', sub: 'Ajansınız görev eklediğinde burada görünecek', icon: ListTodo },
        active: { title: 'Devam eden görev yok', sub: 'Tüm görevler tamamlanmış görünüyor', icon: CheckCircle2 },
        done:   { title: 'Tamamlanan görev yok', sub: 'Tamamlanan görevler burada listelenir', icon: Clock },
    };
    const { title, sub, icon: Icon } = msgs[tab];
    return (
        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-14 flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <Icon className="w-7 h-7 text-zinc-700" />
            </div>
            <p className="text-base font-semibold text-white">{title}</p>
            <p className="text-sm text-zinc-500 max-w-xs">{sub}</p>
        </div>
    );
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────

export default function ClientTasksPage() {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>('active');
    const [reviewTarget, setReviewTarget] = useState<TaskResponse | null>(null);
    const [score, setScore] = useState(0);
    const [hoverScore, setHoverScore] = useState(0);
    const [comment, setComment] = useState('');

    // Tüm görevleri tek sorguda çek, filtreleme client-side
    const { data, isLoading } = useQuery<PageResponse<TaskResponse>>({
        queryKey: ['client-tasks-all'],
        queryFn: () => clientApi.getMyTasks(0, 100),
    });

    const allTasks = data?.content ?? [];
    const activeTasks = allTasks.filter(t => t.status !== 'DONE');
    const doneTasks = allTasks.filter(t => t.status === 'DONE');

    const displayedTasks = activeTab === 'all' ? allTasks
        : activeTab === 'active' ? activeTasks
        : doneTasks;

    // Reviews sadece tamamlananlar için
    const { data: reviewsMap } = useQuery<Record<string, TaskReviewResponse[]>>({
        queryKey: ['client-task-reviews', doneTasks.map(t => t.id).join(',')],
        queryFn: async () => {
            const map: Record<string, TaskReviewResponse[]> = {};
            await Promise.all(doneTasks.map(async t => {
                try { map[t.id] = await clientApi.getTaskReviews(t.id); } catch { map[t.id] = []; }
            }));
            return map;
        },
        enabled: doneTasks.length > 0,
    });

    const reviewMutation = useMutation({
        mutationFn: () => clientApi.reviewTask(reviewTarget!.id, { score, comment: comment || undefined }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['client-task-reviews'] });
            closeReview();
        },
    });

    function openReview(task: TaskResponse) {
        setReviewTarget(task);
        setScore(0);
        setHoverScore(0);
        setComment('');
    }
    function closeReview() {
        setReviewTarget(null);
        setScore(0);
        setComment('');
    }

    // Sayaçlar
    const counts: Record<Tab, number> = {
        all: allTasks.length,
        active: activeTasks.length,
        done: doneTasks.length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Görevler</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Ajansınızın sizin için yürüttüğü tüm çalışmalar
                    </p>
                </div>
                {!isLoading && (
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-400" />
                            {activeTasks.length} devam eden
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            {doneTasks.length} tamamlandı
                        </span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#0C0C0E] border border-white/[0.06] rounded-xl p-1 w-fit">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === key
                                ? 'bg-white/[0.08] text-white'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                        {counts[key] > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                activeTab === key ? 'bg-white/10 text-white' : 'bg-white/[0.04] text-zinc-500'
                            }`}>
                                {counts[key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Liste */}
            {isLoading ? (
                <div className="flex items-center justify-center h-52">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#C8697A] animate-spin" />
                        <p className="text-sm text-zinc-500">Görevler yükleniyor...</p>
                    </div>
                </div>
            ) : displayedTasks.length === 0 ? (
                <Empty tab={activeTab} />
            ) : (
                <div className="space-y-2">
                    {displayedTasks.map((task, i) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            reviews={reviewsMap?.[task.id]}
                            onReview={openReview}
                            delay={i}
                        />
                    ))}
                </div>
            )}

            {/* Review Modal */}
            <AnimatePresence>
                {reviewTarget && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={e => { if (e.target === e.currentTarget) closeReview(); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm space-y-5 shadow-2xl"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-white">Görevi Puanla</h2>
                                <button onClick={closeReview} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="bg-white/[0.03] rounded-xl p-3">
                                <p className="text-sm text-zinc-200 font-medium">{reviewTarget.title}</p>
                                {reviewTarget.description && (
                                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{reviewTarget.description}</p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500 mb-3 text-center">Bu çalışmayı nasıl buldunuz?</p>
                                <div className="flex items-center justify-center gap-3">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button
                                            key={s}
                                            onMouseEnter={() => setHoverScore(s)}
                                            onMouseLeave={() => setHoverScore(0)}
                                            onClick={() => setScore(s)}
                                            className="transition-transform hover:scale-110 active:scale-95"
                                        >
                                            <Star className={`w-9 h-9 transition-colors ${
                                                (hoverScore || score) >= s
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-zinc-700 hover:text-zinc-500'
                                            }`} />
                                        </button>
                                    ))}
                                </div>
                                {score > 0 && (
                                    <p className="text-center text-xs text-zinc-400 mt-2">
                                        {['', 'Kötü', 'Orta', 'İyi', 'Çok İyi', 'Mükemmel'][score]}
                                    </p>
                                )}
                            </div>

                            <textarea
                                placeholder="Yorum veya öneri (opsiyonel)"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                rows={3}
                                className="w-full bg-[#0C0C0E] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 resize-none focus:border-[#C8697A]/50 focus:outline-none"
                            />

                            <button
                                disabled={score === 0 || reviewMutation.isPending}
                                onClick={() => reviewMutation.mutate()}
                                className="w-full py-2.5 bg-[#C8697A] hover:bg-[#B85B6E] text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                            >
                                {reviewMutation.isPending
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                                    : <><Star className="w-4 h-4 fill-current" /> Puanı Gönder</>
                                }
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
