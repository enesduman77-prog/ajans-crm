import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Search, MousePointerClick, Eye, TrendingUp,
    Target, AlertCircle, Loader2, WifiOff, ExternalLink,
    CheckCircle2, Link2, Settings, ArrowUpRight, ChevronDown, Calendar,
    RefreshCw, Globe
} from 'lucide-react';
import { scApi, type ScOverviewResponse, type ScStatusResponse, type ScSite } from '../../api/searchConsole';

interface Props {
    companyId: string;
}

interface PanelDatePreset {
    label: string;
    start: string;
    end: string;
}

const PANEL_PRESETS: PanelDatePreset[] = [
    { label: 'Son 7 Gün', start: '7daysAgo', end: 'today' },
    { label: 'Son 14 Gün', start: '14daysAgo', end: 'today' },
    { label: 'Son 30 Gün', start: '30daysAgo', end: 'today' },
    { label: 'Son 90 Gün', start: '90daysAgo', end: 'today' },
    { label: 'Son 6 Ay', start: '180daysAgo', end: 'today' },
    { label: 'Son 1 Yıl', start: '365daysAgo', end: 'today' },
];

const DEVICE_COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#10b981', '#ec4899'];

function ChartTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1e1e22] border border-white/[0.08] rounded-xl px-4 py-3 shadow-xl">
            <p className="text-xs text-zinc-400 mb-1.5">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                    {entry.name}: {entry.value?.toLocaleString('tr-TR')}
                </p>
            ))}
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color, bgColor, sub }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    sub?: string;
}) {
    return (
        <div className="bg-[#16161a] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className={`h-8 w-8 rounded-lg ${bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                </div>
                {sub && <span className="text-[11px] text-zinc-500">{sub}</span>}
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-zinc-500 text-[12px] mt-0.5">{label}</p>
        </div>
    );
}

export default function SearchConsolePanel({ companyId }: Props) {
    const navigate = useNavigate();
    const [status, setStatus] = useState<ScStatusResponse | null>(null);
    const [data, setData] = useState<ScOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sites, setSites] = useState<ScSite[]>([]);
    const [selectedSite, setSelectedSite] = useState('');
    const [savingSiteUrl, setSavingSiteUrl] = useState(false);
    const [loadingSites, setLoadingSites] = useState(false);
    const [showSiteUrlForm, setShowSiteUrlForm] = useState(false);
    const [datePreset, setDatePreset] = useState(2);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isCustom, setIsCustom] = useState(false);

    const loadSites = () => {
        setLoadingSites(true);
        scApi.listSites(companyId)
            .then(s => {
                setSites(s);
                if (s.length > 0) setSelectedSite(s[0].siteUrl);
            })
            .catch(() => setSites([]))
            .finally(() => setLoadingSites(false));
    };

    const load = () => {
        setLoading(true);
        setError(null);
        const startDate = isCustom ? customStart : PANEL_PRESETS[datePreset].start;
        const endDate = isCustom ? customEnd : PANEL_PRESETS[datePreset].end;
        scApi.getStatus(companyId)
            .then((s: ScStatusResponse) => {
                setStatus(s);
                if (s.connected && s.hasScScope && s.siteUrl) {
                    return scApi.getOverview(companyId, startDate, endDate).then(d => {
                        setData(d);
                        if (d.errorMessage) {
                            setShowSiteUrlForm(true);
                        }
                    });
                }
                if (s.connected && s.hasScScope && !s.siteUrl) {
                    loadSites();
                }
            })
            .catch((err: { response?: { data?: { message?: string } } }) =>
                setError(err?.response?.data?.message || 'Bağlantı hatası')
            )
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [companyId, datePreset, isCustom, customStart, customEnd]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('ga') === 'connected') {
            load();
        }
    }, [companyId]);

    const handleSaveSiteUrl = async (url?: string) => {
        const siteUrl = url || selectedSite;
        if (!siteUrl?.trim()) return;
        setSavingSiteUrl(true);
        try {
            await scApi.saveSiteUrl(companyId, siteUrl.trim());
            setShowSiteUrlForm(false);
            load();
        } finally {
            setSavingSiteUrl(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8 flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                <span className="text-zinc-400 text-sm">Search Console yükleniyor...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#111113] border border-red-500/20 rounded-2xl p-6 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-white">Hata</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{error}</p>
                </div>
            </div>
        );
    }

    // Bağlı değil
    if (!status?.connected) {
        return (
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8">
                <div className="flex flex-col items-center text-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                        <WifiOff className="w-7 h-7 text-zinc-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">Google Search Console Bağlı Değil</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                            Google hesabınızla giriş yaparak Search Console verilerinizi bağlayın.
                        </p>
                    </div>
                    {status?.authUrl && (
                        <a
                            href={status.authUrl}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                        >
                            <Link2 className="w-4 h-4" />
                            Google ile Bağlan
                        </a>
                    )}
                </div>
            </div>
        );
    }

    // Bağlı ama SC scope eksik — yeniden bağlanması gerekiyor
    if (status.needsReconnect) {
        return (
            <div className="bg-[#111113] border border-amber-500/20 rounded-2xl p-8">
                <div className="flex flex-col items-center text-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <RefreshCw className="w-7 h-7 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">Search Console Erişimi Gerekli</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                            Google hesabınız bağlı ancak Search Console erişim izni eksik.<br />
                            Yeniden bağlanarak Search Console izni verin.
                        </p>
                    </div>
                    {status.authUrl && (
                        <a
                            href={status.authUrl}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Yeniden Bağlan
                        </a>
                    )}
                </div>
            </div>
        );
    }

    // Bağlı ve SC scope var ama site URL seçilmemiş
    if (status.connected && !status.siteUrl) {
        return (
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Google Hesabı Bağlandı</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                            İzlemek istediğiniz siteyi seçin.
                        </p>
                    </div>
                    {loadingSites ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                            <span className="text-sm text-zinc-400">Siteler yükleniyor...</span>
                        </div>
                    ) : sites.length > 0 ? (
                        <div className="flex flex-col gap-3 w-full max-w-md">
                            <select
                                value={selectedSite}
                                onChange={e => setSelectedSite(e.target.value)}
                                className="w-full bg-[#1a1a1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                            >
                                {sites.map(s => (
                                    <option key={s.siteUrl} value={s.siteUrl}>
                                        {s.siteUrl} ({s.permissionLevel})
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => handleSaveSiteUrl()}
                                disabled={savingSiteUrl || !selectedSite}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                            >
                                {savingSiteUrl ? 'Kaydediliyor...' : 'Siteyi Seç'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm text-zinc-400 mb-3">
                                Search Console'da erişilebilir site bulunamadı.
                            </p>
                            <a
                                href="https://search.google.com/search-console"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors justify-center"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Search Console'da Site Ekle
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Bağlı ve veri var
    const formatNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();

    const devicePieData = (data?.devices ?? []).map((d, i) => ({
        name: d.name, value: d.clicks, color: DEVICE_COLORS[i % DEVICE_COLORS.length],
    }));
    const totalDeviceClicks = devicePieData.reduce((a, b) => a + b.value, 0);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Search className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Google Search Console</h3>
                        <p className="text-[11px] text-zinc-500">Site: {status.siteUrl} — {isCustom ? `${customStart} — ${customEnd}` : PANEL_PRESETS[datePreset].label}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/client/search-console')}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
                    >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Detaylı İncele
                    </button>
                    {/* Tarih aralığı seçici */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDatePicker(v => !v)}
                            className="flex items-center gap-1.5 bg-[#1a1a1f] border border-white/[0.06] hover:border-white/[0.12] rounded-full px-2.5 py-1 transition-colors"
                        >
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            <span className="text-[11px] text-zinc-400">
                                {isCustom ? `${customStart} — ${customEnd}` : PANEL_PRESETS[datePreset].label}
                            </span>
                            <ChevronDown className="w-3 h-3 text-zinc-500" />
                        </button>
                        {showDatePicker && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                                <div className="absolute right-0 top-full mt-2 z-50 bg-[#1a1a1f] border border-white/[0.08] rounded-xl shadow-2xl p-2 min-w-[200px]">
                                    {PANEL_PRESETS.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setDatePreset(i); setIsCustom(false); setShowDatePicker(false); }}
                                            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                                !isCustom && datePreset === i
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'text-zinc-300 hover:bg-white/[0.05]'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                    <div className="border-t border-white/[0.06] mt-1.5 pt-1.5">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider px-2 py-0.5">Özel Aralık</p>
                                        <div className="px-2 space-y-1.5 mt-1">
                                            <input type="date" value={customStart}
                                                onChange={e => setCustomStart(e.target.value)}
                                                className="w-full bg-[#111113] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500/50" />
                                            <input type="date" value={customEnd}
                                                onChange={e => setCustomEnd(e.target.value)}
                                                className="w-full bg-[#111113] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500/50" />
                                            <button
                                                onClick={() => { if (customStart && customEnd) { setIsCustom(true); setShowDatePicker(false); } }}
                                                disabled={!customStart || !customEnd}
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-medium py-1 rounded-lg transition-colors"
                                            >
                                                Uygula
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400 font-medium">Canlı</span>
                    </div>
                    <button
                        onClick={() => { setShowSiteUrlForm(v => !v); if (!showSiteUrlForm && sites.length === 0) loadSites(); }}
                        title="Site URL Değiştir"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Site URL değiştirme formu */}
            {showSiteUrlForm && (
                <div className="flex gap-2">
                    {sites.length > 0 ? (
                        <>
                            <select
                                value={selectedSite || status.siteUrl}
                                onChange={e => setSelectedSite(e.target.value)}
                                className="flex-1 bg-[#1a1a1f] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                            >
                                {sites.map(s => (
                                    <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => handleSaveSiteUrl()}
                                disabled={savingSiteUrl}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl"
                            >
                                {savingSiteUrl ? '...' : 'Değiştir'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={loadSites}
                            disabled={loadingSites}
                            className="flex items-center gap-2 bg-[#1a1a1f] border border-white/[0.08] hover:border-white/[0.12] text-white text-sm px-4 py-2 rounded-xl transition-colors"
                        >
                            {loadingSites ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Siteleri Yükle
                        </button>
                    )}
                </div>
            )}

            {/* Veri */}
            {data && (
                <>
                    {data.errorMessage && (
                        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-red-300 font-medium">Hata</p>
                                <p className="text-xs text-red-400/80 mt-0.5">{data.errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {!data.errorMessage && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricCard label="Toplam Tıklama" value={formatNum(data.totalClicks)} icon={MousePointerClick} color="text-blue-400" bgColor="bg-blue-500/10" />
                        <MetricCard label="Toplam Gösterim" value={formatNum(data.totalImpressions)} icon={Eye} color="text-emerald-400" bgColor="bg-emerald-500/10" />
                        <MetricCard label="Ort. TO" value={`%${data.avgCtr}`} icon={TrendingUp} color="text-amber-400" bgColor="bg-amber-500/10" />
                        <MetricCard label="Ort. Sıralama" value={data.avgPosition} icon={Target} color="text-purple-400" bgColor="bg-purple-500/10" />
                    </div>}

                    {/* Günlük trend */}
                    {!data.errorMessage && data.dailyTrend.length > 0 && (
                        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <h4 className="text-sm font-semibold text-white">Günlük Tıklama & Gösterim Trendi</h4>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={data.dailyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="scClicks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="scImpressions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} interval={4} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} fill="url(#scClicks)" name="Tıklama" />
                                    <Area yAxisId="right" type="monotone" dataKey="impressions" stroke="#10b981" strokeWidth={2} fill="url(#scImpressions)" name="Gösterim" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Alt satır: Sorgular + Cihazlar */}
                    {!data.errorMessage && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Search className="w-4 h-4 text-blue-400" />
                                    <h4 className="text-sm font-semibold text-white">En Çok Aranan Sorgular</h4>
                                </div>
                                <div className="space-y-2.5">
                                    {data.topQueries.length === 0 && <p className="text-sm text-zinc-600">Veri yok</p>}
                                    {data.topQueries.slice(0, 6).map((q, i) => {
                                        const pct = Math.round((q.clicks / (data.topQueries[0]?.clicks || 1)) * 100);
                                        return (
                                            <div key={i}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[12px] text-zinc-300 truncate max-w-[55%]" title={q.query}>{q.query}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] text-blue-400">{q.clicks} tıklama</span>
                                                        <span className="text-[11px] text-zinc-500">Sıra: {q.position}</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} className="h-full rounded-full bg-blue-500" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Target className="w-4 h-4 text-purple-400" />
                                    <h4 className="text-sm font-semibold text-white">Cihaz Dağılımı</h4>
                                </div>
                                {devicePieData.length > 0 ? (
                                    <div className="relative">
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                <Pie data={devicePieData} cx="50%" cy="45%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                                                    {devicePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                </Pie>
                                                <Legend formatter={(value) => <span className="text-xs text-zinc-400">{value}</span>} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                            <p className="text-lg font-bold text-white">{formatNum(totalDeviceClicks)}</p>
                                            <p className="text-[10px] text-zinc-500">Tıklama</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">Veri yok</div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
}
