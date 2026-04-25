import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from 'recharts';
import {
    Globe, Users, Eye, TrendingUp, MousePointerClick,
    Clock, AlertCircle, Loader2, ArrowLeft, MapPin,
    FileText, CheckCircle2, BarChart3,
    ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Zap, ChevronDown
} from 'lucide-react';
import { gaApi, type GaOverviewResponse, type GaStatusResponse } from '../../api/googleAnalytics';
import { useAuth } from '../../store/AuthContext';

const SOURCE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16'];
const COUNTRY_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

interface DatePreset {
    label: string;
    start: string;
    end: string;
    desc: string;
}

const DATE_PRESETS: DatePreset[] = [
    { label: 'Son 7 Gün', start: '7daysAgo', end: 'today', desc: 'Son 7 günlük' },
    { label: 'Son 14 Gün', start: '14daysAgo', end: 'today', desc: 'Son 14 günlük' },
    { label: 'Son 30 Gün', start: '30daysAgo', end: 'today', desc: 'Son 30 günlük' },
    { label: 'Son 90 Gün', start: '90daysAgo', end: 'today', desc: 'Son 90 günlük' },
    { label: 'Son 6 Ay', start: '180daysAgo', end: 'today', desc: 'Son 6 aylık' },
    { label: 'Son 1 Yıl', start: '365daysAgo', end: 'today', desc: 'Son 1 yıllık' },
];

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

function BigMetricCard({ label, value, icon: Icon, color, bgColor, sub, trend }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    sub?: string;
    trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-colors"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                        trend === 'up' ? 'text-pink-400' : trend === 'down' ? 'text-rose-400' : 'text-zinc-500'
                    }`}>
                        {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> :
                         trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                        {sub}
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-zinc-500 text-[13px] mt-1">{label}</p>
        </motion.div>
    );
}

function SectionHeader({ icon: Icon, title, color, children }: {
    icon: React.ElementType;
    title: string;
    color: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white/80" />
                </div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
            </div>
            {children}
        </div>
    );
}

export default function GoogleAnalyticsDetailPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const companyId = user?.companyId;

    const [status, setStatus] = useState<GaStatusResponse | null>(null);
    const [data, setData] = useState<GaOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activePreset, setActivePreset] = useState(2);
    const [showDateMenu, setShowDateMenu] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isCustomRange, setIsCustomRange] = useState(false);

    const currentRange = isCustomRange
        ? { start: customStart, end: customEnd, desc: `${customStart} — ${customEnd}` }
        : DATE_PRESETS[activePreset];

    const load = (showRefresh = false) => {
        if (!companyId) return;
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const startDate = isCustomRange ? customStart : DATE_PRESETS[activePreset].start;
        const endDate = isCustomRange ? customEnd : DATE_PRESETS[activePreset].end;

        gaApi.getStatus(companyId)
            .then((s: GaStatusResponse) => {
                setStatus(s);
                if (s.connected && s.propertyId) {
                    return gaApi.getOverview(companyId, startDate, endDate).then(d => setData(d));
                }
            })
            .catch((err: { response?: { data?: { message?: string } } }) =>
                setError(err?.response?.data?.message || 'Google Analytics verileri yüklenirken hata oluştu')
            )
            .finally(() => {
                setLoading(false);
                setRefreshing(false);
            });
    };

    useEffect(() => { load(); }, [companyId, activePreset, isCustomRange, customStart, customEnd]);

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}dk ${s}sn`;
    };
    const formatNum = (n: number) => {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toLocaleString('tr-TR');
    };

    const sourcePieData = useMemo(() =>
        (data?.trafficSources ?? []).map((s, i) => ({
            name: s.name, value: s.value, color: SOURCE_COLORS[i % SOURCE_COLORS.length],
        })), [data?.trafficSources]);

    const countryBarData = useMemo(() =>
        (data?.topCountries ?? []).map((c, i) => ({
            name: c.name, value: c.value, fill: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
        })), [data?.topCountries]);

    const totalSources = sourcePieData.reduce((a, b) => a + b.value, 0);
    const totalPages = (data?.topPages ?? []).reduce((a, b) => a + b.value, 0);
    const maxPageViews = Math.max(...(data?.topPages ?? []).map(p => p.value), 1);

    const engagementRate = data ? (100 - data.bounceRate).toFixed(1) : '0';
    const sessionsPerUser = data && data.totalUsers > 0
        ? (data.sessions / data.totalUsers).toFixed(2) : '0';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[#F5BEC8] animate-spin" />
                    <p className="text-zinc-400 text-sm">Google Analytics verileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !status?.connected || !data || data.errorMessage) {
        return (
            <div className="space-y-6">
                <button onClick={() => navigate('/client/analytics')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Rapora Dön
                </button>
                <div className="bg-[#0C0C0E] border border-red-500/20 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                    <div>
                        <p className="text-lg font-semibold text-white">Google Analytics Bağlantı Hatası</p>
                        <p className="text-sm text-zinc-500 mt-1">
                            {error || data?.errorMessage || 'Google Analytics henüz bağlanmamış. Lütfen önce Analitik sayfasından bağlantıyı yapın.'}
                        </p>
                    </div>
                    <button onClick={() => navigate('/client/analytics')}
                        className="bg-[#C8697A] hover:bg-[#B5556A] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                        Analitik Sayfasına Git
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/client/analytics')}
                        className="h-10 w-10 rounded-xl bg-[#0C0C0E] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/[0.12] transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Globe className="w-6 h-6 text-[#F5BEC8]" />
                            Google Analytics Raporu
                        </h1>
                        <p className="text-zinc-500 text-[13px] mt-1">
                            GA4 Mülkü: {status.propertyId} — {currentRange.desc} detaylı analiz
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full px-3 py-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-[11px] text-pink-400 font-medium">Bağlı</span>
                    </div>
                    {/* Tarih aralığı seçici */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDateMenu(v => !v)}
                            className="flex items-center gap-1.5 bg-[#0C0C0E] border border-white/[0.06] hover:border-white/[0.12] rounded-full px-3 py-1.5 transition-colors"
                        >
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-[11px] text-zinc-400">
                                {isCustomRange ? `${customStart} — ${customEnd}` : DATE_PRESETS[activePreset].label}
                            </span>
                            <ChevronDown className="w-3 h-3 text-zinc-500" />
                        </button>
                        {showDateMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDateMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 z-50 bg-[#1a1a1f] border border-white/[0.08] rounded-xl shadow-2xl p-2 min-w-[220px]">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider px-2 py-1">Hazır Aralıklar</p>
                                    {DATE_PRESETS.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setActivePreset(i); setIsCustomRange(false); setShowDateMenu(false); }}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                                                !isCustomRange && activePreset === i
                                                    ? 'bg-[#C8697A]/10 text-[#F5BEC8]'
                                                    : 'text-zinc-300 hover:bg-white/[0.05]'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                    <div className="border-t border-white/[0.06] mt-2 pt-2">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider px-2 py-1">Özel Tarih Aralığı</p>
                                        <div className="px-2 space-y-2 mt-1">
                                            <div>
                                                <label className="text-[10px] text-zinc-500">Başlangıç</label>
                                                <input type="date" value={customStart}
                                                    onChange={e => setCustomStart(e.target.value)}
                                                    className="w-full bg-[#0C0C0E] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8697A]/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-zinc-500">Bitiş</label>
                                                <input type="date" value={customEnd}
                                                    onChange={e => setCustomEnd(e.target.value)}
                                                    className="w-full bg-[#0C0C0E] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8697A]/50" />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (customStart && customEnd) {
                                                        setIsCustomRange(true);
                                                        setShowDateMenu(false);
                                                    }
                                                }}
                                                disabled={!customStart || !customEnd}
                                                className="w-full bg-[#C8697A] hover:bg-[#B5556A] disabled:opacity-40 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                                            >
                                                Uygula
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => load(true)}
                        disabled={refreshing}
                        className="h-8 w-8 rounded-lg bg-[#0C0C0E] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-50"
                        title="Verileri Yenile"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* === ANA METRİKLER === */}
            <section>
                <SectionHeader icon={Zap} title="Genel Bakış" color="bg-[#C8697A]/20">
                    <span className="text-[11px] text-zinc-500">{currentRange.desc} özet veriler</span>
                </SectionHeader>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <BigMetricCard
                        label="Toplam Oturum"
                        value={formatNum(data.sessions)}
                        icon={TrendingUp}
                        color="text-[#F5BEC8]"
                        bgColor="bg-[#C8697A]/10"
                    />
                    <BigMetricCard
                        label="Toplam Kullanıcı"
                        value={formatNum(data.totalUsers)}
                        icon={Users}
                        color="text-pink-400"
                        bgColor="bg-pink-500/10"
                    />
                    <BigMetricCard
                        label="Yeni Kullanıcı"
                        value={formatNum(data.newUsers)}
                        icon={Users}
                        color="text-cyan-400"
                        bgColor="bg-cyan-500/10"
                        sub={data.totalUsers > 0 ? `%${((data.newUsers / data.totalUsers) * 100).toFixed(1)} yeni` : undefined}
                        trend="up"
                    />
                    <BigMetricCard
                        label="Sayfa Görüntüleme"
                        value={formatNum(data.pageViews)}
                        icon={Eye}
                        color="text-amber-400"
                        bgColor="bg-amber-500/10"
                    />
                </div>
            </section>

            {/* === PERFORMANS METRİKLERİ === */}
            <section>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <MousePointerClick className="w-4 h-4 text-rose-400" />
                            <span className="text-xs text-zinc-500">Hemen Çıkma Oranı</span>
                        </div>
                        <p className="text-2xl font-bold text-white">%{data.bounceRate}</p>
                        <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all"
                                style={{ width: `${Math.min(data.bounceRate, 100)}%` }} />
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-pink-400" />
                            <span className="text-xs text-zinc-500">Etkileşim Oranı</span>
                        </div>
                        <p className="text-2xl font-bold text-white">%{engagementRate}</p>
                        <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full transition-all"
                                style={{ width: `${Math.min(parseFloat(engagementRate), 100)}%` }} />
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-zinc-500">Ortalama Oturum Süresi</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatDuration(data.avgSessionDuration)}</p>
                        <p className="text-[11px] text-zinc-600 mt-2">Kullanıcı başına {sessionsPerUser} oturum</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-zinc-500">Sayfa / Oturum</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {data.sessions > 0 ? (data.pageViews / data.sessions).toFixed(2) : '0'}
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-2">Oturum başına görüntülenen sayfa</p>
                    </motion.div>
                </div>
            </section>

            {/* === GÜNLÜK TREND === */}
            <section>
                <SectionHeader icon={TrendingUp} title="Günlük Oturum & Kullanıcı Trendi" color="bg-[#C8697A]/20" />
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.dailyTrend}>
                                <defs>
                                    <linearGradient id="detailOturum" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="detailKullanici" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 11, fill: '#71717a' }}
                                    tickFormatter={(d: string) => {
                                        const parts = d.split('-');
                                        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
                                    }} />
                                <YAxis stroke="#52525b" tick={{ fontSize: 11, fill: '#71717a' }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Legend verticalAlign="top" height={36}
                                    formatter={(v: string) => <span className="text-xs text-zinc-400">{v}</span>} />
                                <Area type="monotone" dataKey="sessions" name="Oturum" stroke="#3b82f6"
                                    fill="url(#detailOturum)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="users" name="Kullanıcı" stroke="#10b981"
                                    fill="url(#detailKullanici)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* === TRAFİK KAYNAKLARI + ÜLKELER === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Trafik Kaynakları - Pie */}
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6">
                    <SectionHeader icon={Globe} title="Trafik Kaynakları" color="bg-[#C8697A]/20" />
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={sourcePieData} dataKey="value" nameKey="name"
                                    cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                    paddingAngle={3} strokeWidth={0}>
                                    {sourcePieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                                <Legend verticalAlign="bottom" height={36}
                                    formatter={(v: string) => <span className="text-xs text-zinc-400">{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {sourcePieData.map((s) => (
                            <div key={s.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                                    <span className="text-sm text-zinc-300">{s.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-white">{s.value.toLocaleString('tr-TR')}</span>
                                    <span className="text-xs text-zinc-500 w-12 text-right">
                                        %{totalSources > 0 ? ((s.value / totalSources) * 100).toFixed(1) : '0'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ülkeler */}
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6">
                    <SectionHeader icon={MapPin} title="Ziyaretçi Ülkeleri" color="bg-purple-500/20" />
                    {countryBarData.length > 0 ? (
                        <>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={countryBarData} layout="vertical" margin={{ left: 0, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                        <XAxis type="number" stroke="#52525b" tick={{ fontSize: 11, fill: '#71717a' }} />
                                        <YAxis type="category" dataKey="name" stroke="#52525b"
                                            tick={{ fontSize: 12, fill: '#a1a1aa' }} width={100} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="value" name="Oturum" radius={[0, 6, 6, 0]} barSize={24}>
                                            {countryBarData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                                {countryBarData.map((c, i) => (
                                    <div key={c.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-500 text-xs font-mono w-5">#{i + 1}</span>
                                            <span className="text-sm text-zinc-300">{c.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-white">
                                            {c.value.toLocaleString('tr-TR')} oturum
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
                            Ülke verisi bulunamadı
                        </div>
                    )}
                </div>
            </div>

            {/* === EN ÇOK ZİYARET EDİLEN SAYFALAR === */}
            <section>
                <SectionHeader icon={FileText} title="En Çok Ziyaret Edilen Sayfalar" color="bg-amber-500/20">
                    <span className="text-[11px] text-zinc-500">
                        Toplam {totalPages.toLocaleString('tr-TR')} sayfa görüntüleme
                    </span>
                </SectionHeader>
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6">
                    {(data.topPages ?? []).length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1 text-[11px] text-zinc-500 uppercase tracking-wider">
                                <span>Sayfa Yolu</span>
                                <span>Görüntüleme</span>
                            </div>
                            {data.topPages.map((page, i) => {
                                const pct = (page.value / maxPageViews) * 100;
                                return (
                                    <motion.div
                                        key={page.name}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="relative"
                                    >
                                        <div className="absolute inset-0 rounded-xl overflow-hidden">
                                            <div className="h-full bg-[#C8697A]/[0.10] rounded-xl transition-all duration-500"
                                                style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="relative flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-zinc-600 text-xs font-mono w-5 flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                <span className="text-sm text-zinc-200 truncate" title={page.name}>
                                                    {page.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className="text-sm font-semibold text-white">
                                                    {page.value.toLocaleString('tr-TR')}
                                                </span>
                                                <span className="text-[11px] text-zinc-500 w-12 text-right">
                                                    %{totalPages > 0 ? ((page.value / totalPages) * 100).toFixed(1) : '0'}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
                            Sayfa verisi bulunamadı
                        </div>
                    )}
                </div>
            </section>

            {/* === ÖZET RAPOR === */}
            <section>
                <SectionHeader icon={BarChart3} title="Performans Özeti" color="bg-pink-500/20" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Kullanıcı dağılımı */}
                    <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                        <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Kullanıcı Dağılımı</h4>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-zinc-400">Mevcut Kullanıcı</span>
                                    <span className="text-white font-semibold">{formatNum(data.totalUsers - data.newUsers)}</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#C8697A] rounded-full"
                                        style={{ width: `${data.totalUsers > 0 ? ((data.totalUsers - data.newUsers) / data.totalUsers) * 100 : 0}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-zinc-400">Yeni Kullanıcı</span>
                                    <span className="text-white font-semibold">{formatNum(data.newUsers)}</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-pink-500 rounded-full"
                                        style={{ width: `${data.totalUsers > 0 ? (data.newUsers / data.totalUsers) * 100 : 0}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Etkileşim skoru */}
                    <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center justify-center">
                        <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Etkileşim Skoru</h4>
                        <div className="relative w-32 h-32">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="8" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${parseFloat(engagementRate) * 2.64} 264`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white">%{engagementRate}</span>
                                <span className="text-[10px] text-zinc-500">Etkileşim</span>
                            </div>
                        </div>
                    </div>

                    {/* Hızlı istatistikler */}
                    <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                        <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Hızlı İstatistikler</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Sayfa / Oturum</span>
                                <span className="text-sm font-semibold text-white">
                                    {data.sessions > 0 ? (data.pageViews / data.sessions).toFixed(2) : '0'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Oturum / Kullanıcı</span>
                                <span className="text-sm font-semibold text-white">{sessionsPerUser}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Trafik Kaynağı Sayısı</span>
                                <span className="text-sm font-semibold text-white">{sourcePieData.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Ülke Sayısı</span>
                                <span className="text-sm font-semibold text-white">{countryBarData.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">İzlenen Sayfa</span>
                                <span className="text-sm font-semibold text-white">{(data.topPages ?? []).length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
