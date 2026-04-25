import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Gauge, RefreshCw, AlertCircle, Loader2, Smartphone, Monitor,
    Server, Calendar, ShieldCheck, Layers, Clock, Wrench,
    CheckCircle2, ExternalLink, ArrowRight,
} from 'lucide-react';
import {
    webDesignApi,
    type PageSpeedReport,
    type PageSpeedScore,
    type MaintenanceLogEntry,
} from '../../api/webDesign';

interface Props {
    /** When omitted, hits the client endpoints (own company). */
    companyId?: string;
}

type Strategy = 'mobile' | 'desktop';

const CATEGORY_LABELS: Record<string, string> = {
    update: 'Güncelleme',
    fix: 'Hata Düzeltme',
    feature: 'Yeni Özellik',
    security: 'Güvenlik',
    content: 'İçerik',
    seo: 'SEO',
    other: 'Diğer',
};

function scoreColor(score?: number | null): string {
    if (score == null) return 'text-zinc-500';
    if (score >= 90) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
}

function scoreRing(score?: number | null): string {
    if (score == null) return 'stroke-zinc-700';
    if (score >= 90) return 'stroke-emerald-400';
    if (score >= 50) return 'stroke-amber-400';
    return 'stroke-red-400';
}

function ScoreCircle({ label, score }: { label: string; score?: number | null }) {
    const value = score ?? 0;
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius}
                            className="stroke-white/[0.06] fill-none" strokeWidth="6" />
                    {score != null && (
                        <circle cx="40" cy="40" r={radius}
                                className={`fill-none ${scoreRing(score)} transition-all duration-700`}
                                strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={circumference} strokeDashoffset={offset} />
                    )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xl font-bold ${scoreColor(score)}`}>
                        {score ?? '—'}
                    </span>
                </div>
            </div>
            <span className="text-[11px] text-zinc-400 text-center leading-tight">{label}</span>
        </div>
    );
}

function formatMs(ms?: number | null): string {
    if (ms == null) return '—';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
}

function formatCls(cls?: number | null): string {
    if (cls == null) return '—';
    return cls.toFixed(3);
}

function formatDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatRelative(value?: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60_000);
    if (min < 1) return 'Az önce';
    if (min < 60) return `${min} dk önce`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} sa önce`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days} gün önce`;
    return d.toLocaleDateString('tr-TR');
}

function ScoresPanel({ report, refreshing, onRefresh, onDetail }: {
    report: PageSpeedReport | null;
    refreshing: boolean;
    onRefresh: () => void;
    onDetail?: () => void;
}) {
    const [strategy, setStrategy] = useState<Strategy>('mobile');
    const score: PageSpeedScore | undefined =
        strategy === 'mobile' ? report?.mobile : report?.desktop;

    return (
        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[#F5BEC8]" />
                    <h3 className="text-sm font-semibold text-zinc-200">Site Sağlık Skoru</h3>
                    {onDetail && (
                        <button
                            onClick={onDetail}
                            className="flex items-center gap-1 text-[11px] text-[#F5BEC8] hover:text-white transition-colors ml-1"
                        >
                            Detaylı Bak <ArrowRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5">
                        <button
                            onClick={() => setStrategy('mobile')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                strategy === 'mobile' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <Smartphone className="w-3 h-3" /> Mobil
                        </button>
                        <button
                            onClick={() => setStrategy('desktop')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                strategy === 'desktop' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <Monitor className="w-3 h-3" /> Masaüstü
                        </button>
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50"
                        title="Yenile"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {score?.fetchError ? (
                <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                        <p className="text-amber-300 font-medium mb-1">Skor alınamadı</p>
                        <p className="text-zinc-500">{score.fetchError}</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        <ScoreCircle label="Performans" score={score?.performance} />
                        <ScoreCircle label="Erişilebilirlik" score={score?.accessibility} />
                        <ScoreCircle label="En İyi Pratikler" score={score?.bestPractices} />
                        <ScoreCircle label="SEO" score={score?.seo} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/[0.04]">
                        <CoreVital label="LCP" value={formatMs(score?.lcpMs)} hint="Largest Contentful Paint" />
                        <CoreVital label="FCP" value={formatMs(score?.fcpMs)} hint="First Contentful Paint" />
                        <CoreVital label="TBT" value={formatMs(score?.tbtMs)} hint="Total Blocking Time" />
                        <CoreVital label="CLS" value={formatCls(score?.clsValue)} hint="Cumulative Layout Shift" />
                        <CoreVital label="FID" value={formatMs(score?.fidMs)} hint="Max Potential FID" />
                        <CoreVital label="Son ölçüm" value={formatRelative(score?.fetchedAt)} hint={score?.testedUrl ?? ''} />
                    </div>
                </>
            )}
        </div>
    );
}

function CoreVital({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3" title={hint}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
        </div>
    );
}

function InfrastructureCard({ report }: { report: PageSpeedReport | null }) {
    const items: Array<{ icon: typeof Server; label: string; value: string; sub?: string }> = [];

    if (report?.websiteUrl) {
        items.push({ icon: ExternalLink, label: 'Web Adresi', value: report.websiteUrl });
    }
    if (report?.hostingProvider) {
        items.push({ icon: Server, label: 'Hosting', value: report.hostingProvider });
    }
    if (report?.domainExpiry) {
        items.push({ icon: Calendar, label: 'Domain Bitiş', value: formatDate(report.domainExpiry) });
    }
    if (report?.sslExpiry) {
        items.push({ icon: ShieldCheck, label: 'SSL Bitiş', value: formatDate(report.sslExpiry) });
    }
    if (report?.cmsType) {
        items.push({
            icon: Layers,
            label: 'CMS',
            value: report.cmsVersion ? `${report.cmsType} ${report.cmsVersion}` : report.cmsType,
        });
    }
    if (report?.themeName) {
        items.push({ icon: Layers, label: 'Tema', value: report.themeName });
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <Server className="w-4 h-4 text-[#F5BEC8]" />
                <h3 className="text-sm font-semibold text-zinc-200">Altyapı</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-[#F5BEC8]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{item.label}</p>
                                <p className="text-sm font-semibold text-white truncate" title={item.value}>{item.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MaintenanceTimeline({ entries }: { entries: MaintenanceLogEntry[] }) {
    if (entries.length === 0) {
        return (
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Wrench className="w-4 h-4 text-[#F5BEC8]" />
                    <h3 className="text-sm font-semibold text-zinc-200">Bakım Günlüğü</h3>
                </div>
                <p className="text-xs text-zinc-500 text-center py-8">
                    Henüz bakım kaydı yok.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#F5BEC8]" />
                    <h3 className="text-sm font-semibold text-zinc-200">Bakım Günlüğü</h3>
                </div>
                <span className="text-xs text-zinc-500">{entries.length} kayıt</span>
            </div>
            <div className="space-y-3">
                {entries.map((entry, i) => (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex gap-3 group"
                    >
                        <div className="flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-[#C8697A]/10 border border-[#C8697A]/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-[#F5BEC8]" />
                            </div>
                            {i < entries.length - 1 && (
                                <div className="w-px flex-1 bg-white/[0.04] mt-1" />
                            )}
                        </div>
                        <div className="flex-1 pb-3 min-w-0">
                            <div className="flex items-baseline justify-between gap-3 flex-wrap">
                                <h4 className="text-sm font-semibold text-white">{entry.title}</h4>
                                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(entry.performedAt)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 mb-1">
                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.04]">
                                    {CATEGORY_LABELS[entry.category] ?? entry.category}
                                </span>
                                {entry.performedByName && (
                                    <span className="text-[11px] text-zinc-500">
                                        {entry.performedByName}
                                    </span>
                                )}
                            </div>
                            {entry.description && (
                                <p className="text-xs text-zinc-400 leading-relaxed">{entry.description}</p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default function WebDesignPanel({ companyId }: Props) {
    const navigate = useNavigate();
    const [report, setReport] = useState<PageSpeedReport | null>(null);
    const [log, setLog] = useState<MaintenanceLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReport = async (refresh = false) => {
        const data = companyId
            ? await webDesignApi.getCompanyPageSpeed(companyId, refresh)
            : await webDesignApi.getMyPageSpeed(refresh);
        setReport(data);
    };

    const fetchLog = async () => {
        const data = companyId
            ? await webDesignApi.getCompanyMaintenanceLog(companyId)
            : await webDesignApi.getMyMaintenanceLog();
        setLog(data);
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([fetchReport(false), fetchLog()])
            .catch(() => {
                /* report/log already null */
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchReport(true);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-12 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
        );
    }

    if (!report?.configured && !report?.websiteUrl) {
        return (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-amber-300">Web Tasarım Paneli Hazır Değil</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                        Şirket için web sitesi adresi tanımlı değil. Yönetici panelinden eklendiğinde site sağlık skorları
                        burada görünecek.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <ScoresPanel report={report} refreshing={refreshing} onRefresh={handleRefresh}
                onDetail={!companyId ? () => navigate('/client/web-design') : undefined} />
            <InfrastructureCard report={report} />
            <MaintenanceTimeline entries={log} />
        </div>
    );
}
