import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Globe, Users, Eye, TrendingUp, MousePointerClick,
    Clock, AlertCircle, Loader2, WifiOff, ExternalLink,
    MapPin, FileText, CheckCircle2, Link2, Unlink, Settings, ArrowUpRight, ChevronDown, Calendar
} from 'lucide-react';
import { gaApi, type GaOverviewResponse, type GaStatusResponse } from '../../api/googleAnalytics';

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

// â”€â”€â”€ Renk paleti â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SOURCE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4'];

// â”€â”€â”€ Tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Metrik kartÄ± â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Ana bileÅŸen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function GoogleAnalyticsPanel({ companyId }: Props) {
    const navigate = useNavigate();
    const [status, setStatus] = useState<GaStatusResponse | null>(null);
    const [data, setData] = useState<GaOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [propertyInput, setPropertyInput] = useState('');
    const [savingProperty, setSavingProperty] = useState(false);
    const [showPropertyForm, setShowPropertyForm] = useState(false);
    const [datePreset, setDatePreset] = useState(2); // default: Son 30 Gün
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isCustom, setIsCustom] = useState(false);

    const load = () => {
        setLoading(true);
        setError(null);
        const startDate = isCustom ? customStart : PANEL_PRESETS[datePreset].start;
        const endDate = isCustom ? customEnd : PANEL_PRESETS[datePreset].end;
        gaApi.getStatus(companyId)
            .then((s: GaStatusResponse) => {
                setStatus(s);
                setPropertyInput(s.propertyId || '');
                if (s.connected && s.propertyId) {
                    return gaApi.getOverview(companyId, startDate, endDate).then(d => {
                        setData(d);
                        // Mülk ID hatalıysa formu otomatik aç
                        if (d.errorMessage) {
                            setShowPropertyForm(true);
                        }
                    });
                }
            })
            .catch((err: { response?: { data?: { message?: string } } }) =>
                setError(err?.response?.data?.message || 'Bağlantı hatası')
            )
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();    }, [companyId, datePreset, isCustom, customStart, customEnd]);

    useEffect(() => {        // URL'de ga=connected parametresi varsa (OAuth callback sonrasÄ±)
        const params = new URLSearchParams(window.location.search);
        if (params.get('ga') === 'connected') {
            load();
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [companyId]);

    const handleSaveProperty = async () => {
        if (!propertyInput.trim()) return;
        setSavingProperty(true);
        try {
            await gaApi.saveProperty(companyId, propertyInput.trim());
            setShowPropertyForm(false);
            load();
        } finally {
            setSavingProperty(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Google Analytics bağlantısını kesmek istediğinizden emin misiniz?')) return;
        await gaApi.disconnect(companyId);
        setData(null);
        setStatus(null);
        load();
    };

    if (loading) {
        return (
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-8 flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-zinc-400 text-sm">Google Analytics yükleniyor...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#0C0C0E] border border-red-500/20 rounded-2xl p-6 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-white">Hata</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{error}</p>
                </div>
            </div>
        );
    }

    // â”€â”€â”€ BaÄŸlÄ± deÄŸil â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!status?.connected) {
        return (
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-8">
                <div className="flex flex-col items-center text-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                        <WifiOff className="w-7 h-7 text-zinc-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">Google Analytics Bağlı Değil</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                            Google hesabınızla giriş yaparak Analytics verilerinizi bağlayın.
                        </p>
                    </div>
                    {status?.authUrl && (
                        <a
                            href={status.authUrl}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                        >
                            <Link2 className="w-4 h-4" />
                            Google Analytics'i Bağla
                        </a>
                    )}
                    <a
                        href="https://analytics.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Google Analytics'e Git
                    </a>
                </div>
            </div>
        );
    }

    // â”€â”€â”€ BaÄŸlÄ± ama property seÃ§ilmemiÅŸ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (status.connected && !status.propertyId) {
        return (
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-8">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Google Hesabı Bağlandı</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                            GA4 mülk ID'nizi girin. GA4 Property ID'nizi{' '}
                            <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer"
                                className="text-blue-400 hover:underline">Google Analytics</a>{' '}
                            &gt; Yönetici &gt; Mülk Ayarları'ndan bulabilirsiniz.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full max-w-sm">
                        <input
                            type="text"
                            value={propertyInput}
                            onChange={e => setPropertyInput(e.target.value)}
                            placeholder="Örn: 123456789"
                            className="flex-1 bg-[#1a1a1f] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
                        />
                        <button
                            onClick={handleSaveProperty}
                            disabled={savingProperty || !propertyInput.trim()}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                        >
                            {savingProperty ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // â”€â”€â”€ BaÄŸlÄ± ve veri var â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}dk ${s}s`;
    };
    const formatNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();

    const sourcePieData = (data?.trafficSources ?? []).map((s, i) => ({
        name: s.name, value: s.value, color: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }));
    const totalSources = sourcePieData.reduce((a, b) => a + b.value, 0);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* BaÅŸlÄ±k */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Google Analytics</h3>
                        <p className="text-[11px] text-zinc-500">GA4 Mülkü: {status.propertyId} — {isCustom ? `${customStart} — ${customEnd}` : PANEL_PRESETS[datePreset].label}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/client/google-analytics')}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
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
                                                    ? 'bg-blue-500/10 text-blue-400'
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
                                                className="w-full bg-[#0C0C0E] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500/50" />
                                            <input type="date" value={customEnd}
                                                onChange={e => setCustomEnd(e.target.value)}
                                                className="w-full bg-[#0C0C0E] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500/50" />
                                            <button
                                                onClick={() => { if (customStart && customEnd) { setIsCustom(true); setShowDatePicker(false); } }}
                                                disabled={!customStart || !customEnd}
                                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-[11px] font-medium py-1 rounded-lg transition-colors"
                                            >
                                                Uygula
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full px-3 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-[11px] text-pink-400 font-medium">Canlı</span>
                    </div>
                    <button
                        onClick={() => setShowPropertyForm(v => !v)}
                        title="Property ID Değiştir"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDisconnect}
                        title="Bağlantıyı Kes"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <Unlink className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Property deÄŸiÅŸtirme formu */}
            {showPropertyForm && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={propertyInput}
                        onChange={e => setPropertyInput(e.target.value)}
                        placeholder="Yeni GA4 Property ID"
                        className="flex-1 bg-[#1a1a1f] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                        onClick={handleSaveProperty}
                        disabled={savingProperty}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl"
                    >
                        {savingProperty ? '...' : 'Kaydet'}
                    </button>
                </div>
            )}

            {/* Metrik kartları */}
            {data && (
                <>
                    {/* Hata banner — yanlış property ID */}
                    {data.errorMessage && (
                        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-red-300 font-medium">Mülk ID Hatası</p>
                                <p className="text-xs text-red-400/80 mt-0.5">{data.errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {!data.errorMessage && <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <MetricCard label="Oturum" value={formatNum(data.sessions)} icon={TrendingUp} color="text-blue-400" bgColor="bg-blue-500/10" />
                        <MetricCard label="Kullanıcı" value={formatNum(data.totalUsers)} icon={Users} color="text-pink-400" bgColor="bg-pink-500/10" />
                        <MetricCard label="Yeni Kullanıcı" value={formatNum(data.newUsers)} icon={Users} color="text-cyan-400" bgColor="bg-cyan-500/10" />
                        <MetricCard label="Sayfa Görüntüleme" value={formatNum(data.pageViews)} icon={Eye} color="text-amber-400" bgColor="bg-amber-500/10" />
                        <MetricCard label="Hemen Çıkma" value={`%${data.bounceRate}`} icon={MousePointerClick} color="text-rose-400" bgColor="bg-rose-500/10" />
                        <MetricCard label="Ort. Süre" value={formatDuration(data.avgSessionDuration)} icon={Clock} color="text-purple-400" bgColor="bg-purple-500/10" />
                    </div>}

                    {/* Grafik satırı */}
                    {!data.errorMessage && <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                <h4 className="text-sm font-semibold text-white">Günlük Oturum & Kullanıcı Trendi</h4>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={data.dailyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gaSessions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gaUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} interval={4} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} fill="url(#gaSessions)" name="Oturum" />
                                    <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} fill="url(#gaUsers)" name="Kullanıcı" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Globe className="w-4 h-4 text-amber-400" />
                                <h4 className="text-sm font-semibold text-white">Trafik Kaynakları</h4>
                            </div>
                            {sourcePieData.length > 0 ? (
                                <div className="relative">
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie data={sourcePieData} cx="50%" cy="45%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                                                {sourcePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Legend formatter={(value) => <span className="text-xs text-zinc-400">{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                        <p className="text-lg font-bold text-white">{formatNum(totalSources)}</p>
                                        <p className="text-[10px] text-zinc-500">Oturum</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">Veri yok</div>
                            )}
                        </div>
                    </div>}

                    {/* Alt satır */}
                    {!data.errorMessage && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-4 h-4 text-cyan-400" />
                                <h4 className="text-sm font-semibold text-white">En Çok Ziyaret Edilen Sayfalar</h4>
                            </div>
                            <div className="space-y-2.5">
                                {data.topPages.length === 0 && <p className="text-sm text-zinc-600">Veri yok</p>}
                                {data.topPages.map((page, i) => {
                                    const pct = Math.round((page.value / (data.topPages[0]?.value || 1)) * 100);
                                    return (
                                        <div key={i}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[12px] text-zinc-300 truncate max-w-[75%]" title={page.name}>{page.name}</span>
                                                <span className="text-[12px] text-zinc-500">{page.value.toLocaleString('tr-TR')}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} className="h-full rounded-full bg-cyan-500" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-4 h-4 text-pink-400" />
                                <h4 className="text-sm font-semibold text-white">Ülkelere Göre Oturumlar</h4>
                            </div>
                            <div className="space-y-3">
                                {data.topCountries.length === 0 && <p className="text-sm text-zinc-600">Veri yok</p>}
                                {data.topCountries.map((country, i) => {
                                    const pct = Math.round((country.value / (data.topCountries[0]?.value || 1)) * 100);
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-sm text-zinc-500 w-4 text-right flex-shrink-0">{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[13px] text-zinc-300 truncate">{country.name}</span>
                                                    <span className="text-[12px] text-zinc-500 ml-2">{country.value.toLocaleString('tr-TR')}</span>
                                                </div>
                                                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.08 }} className="h-full rounded-full bg-pink-500" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>}
                </>
            )}
        </motion.div>
    );
}
