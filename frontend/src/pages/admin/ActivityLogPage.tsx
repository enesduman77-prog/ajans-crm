import { useEffect, useState } from 'react';
import { activityLogApi, type ActivityLogResponse } from '../../api/features';
import { motion } from 'framer-motion';
import { Activity, Filter, User, ClipboardList, FileText, LogIn, LogOut, Trash2, Upload, Edit, Plus, Shield, Loader2 } from 'lucide-react';

const actionIcons: Record<string, typeof Activity> = {
    CREATE: Plus,
    UPDATE: Edit,
    DELETE: Trash2,
    LOGIN: LogIn,
    LOGOUT: LogOut,
    ASSIGN: User,
    UNASSIGN: User,
    STATUS_CHANGE: ClipboardList,
    PERMISSION_CHANGE: Shield,
    FILE_UPLOAD: Upload,
    FILE_DELETE: Trash2,
    EXPORT: FileText,
};

const actionLabels: Record<string, string> = {
    CREATE: 'Oluşturma',
    UPDATE: 'Güncelleme',
    DELETE: 'Silme',
    LOGIN: 'Giriş',
    LOGOUT: 'Çıkış',
    ASSIGN: 'Atama',
    UNASSIGN: 'Atama Kaldırma',
    STATUS_CHANGE: 'Durum Değişikliği',
    PERMISSION_CHANGE: 'Yetki Değişikliği',
    FILE_UPLOAD: 'Dosya Yükleme',
    FILE_DELETE: 'Dosya Silme',
    EXPORT: 'Dışa Aktarma',
};

const actionColors: Record<string, string> = {
    CREATE: 'text-emerald-400 bg-emerald-500/10',
    UPDATE: 'text-blue-400 bg-blue-500/10',
    DELETE: 'text-red-400 bg-red-500/10',
    LOGIN: 'text-green-400 bg-green-500/10',
    LOGOUT: 'text-zinc-400 bg-zinc-500/10',
    ASSIGN: 'text-orange-400 bg-orange-500/10',
    UNASSIGN: 'text-amber-400 bg-amber-500/10',
    STATUS_CHANGE: 'text-purple-400 bg-purple-500/10',
    PERMISSION_CHANGE: 'text-yellow-400 bg-yellow-500/10',
    FILE_UPLOAD: 'text-cyan-400 bg-cyan-500/10',
    FILE_DELETE: 'text-red-400 bg-red-500/10',
    EXPORT: 'text-indigo-400 bg-indigo-500/10',
};

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<ActivityLogResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [entityTypeFilter, setEntityTypeFilter] = useState<string>('ALL');

    useEffect(() => {
        setLoading(true);
        const fetchFn = entityTypeFilter === 'ALL'
            ? activityLogApi.getAll(page, 25)
            : activityLogApi.getByEntityType(entityTypeFilter, page, 25);

        fetchFn
            .then(data => {
                setLogs(data.content);
                setTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [page, entityTypeFilter]);

    const formatDate = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        if (isToday) return `Bugün ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const entityTypes = ['ALL', 'TASK', 'COMPANY', 'USER', 'MEETING', 'SHOOT', 'NOTE'];
    const entityLabels: Record<string, string> = {
        ALL: 'Tümü', TASK: 'Görev', COMPANY: 'Şirket', USER: 'Kullanıcı',
        MEETING: 'Toplantı', SHOOT: 'Çekim', NOTE: 'Not',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Aktivite Günlüğü</h1>
                    <p className="text-sm text-zinc-500 mt-1">Tüm sistem aktivitelerini takip edin</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                {entityTypes.map(type => (
                    <button
                        key={type}
                        onClick={() => { setEntityTypeFilter(type); setPage(0); }}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${entityTypeFilter === type
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:text-zinc-300'
                            }`}
                    >
                        {entityLabels[type] || type}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                </div>
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                    <Activity className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm">Aktivite kaydı bulunamadı</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-white/[0.06]" />
                    <div className="space-y-1">
                        {logs.map((log, idx) => {
                            const Icon = actionIcons[log.action] || Activity;
                            const colorClass = actionColors[log.action] || 'text-zinc-400 bg-zinc-500/10';
                            const [textColor, bgColor] = colorClass.split(' ');
                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="relative flex items-start gap-4 pl-12 pr-4 py-3 hover:bg-white/[0.02] rounded-xl transition-colors"
                                >
                                    <div className={`absolute left-3 top-4 w-6 h-6 rounded-full flex items-center justify-center ${bgColor}`}>
                                        <Icon className={`w-3 h-3 ${textColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[13px] font-medium text-white">{log.userName}</span>
                                            <span className={`text-[11px] px-1.5 py-0.5 rounded ${bgColor} ${textColor}`}>
                                                {actionLabels[log.action] || log.action}
                                            </span>
                                            {log.entityName && (
                                                <span className="text-[12px] text-zinc-400">— {log.entityName}</span>
                                            )}
                                        </div>
                                        {log.entityType && (
                                            <p className="text-[11px] text-zinc-600 mt-0.5">
                                                {entityLabels[log.entityType] || log.entityType}
                                                {log.entityId && ` #${log.entityId.substring(0, 8)}`}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-zinc-700 whitespace-nowrap mt-0.5">{formatDate(log.createdAt)}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
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
