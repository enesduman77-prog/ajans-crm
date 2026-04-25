import { useState, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import {

    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,

    ResponsiveContainer

} from 'recharts';

import {

    Instagram, Users, UserPlus, Eye, MousePointerClick,

    Heart, MessageCircle, TrendingUp, AlertCircle, Loader2,

    ArrowLeft, CheckCircle2, Calendar, ChevronDown,

    Image as ImageIcon, LogOut, UserMinus, BarChart3,

    ChevronLeft, ChevronRight, Play, ExternalLink,

} from 'lucide-react';

import { igApi, type IgOverviewResponse, type IgStatusResponse, type IgReelRow } from '../../api/instagram';

import { useAuth } from '../../store/AuthContext';



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

    trend?: 'up' | 'down' | null;

}) {

    return (

        <motion.div

            initial={{ opacity: 0, y: 8 }}

            animate={{ opacity: 1, y: 0 }}

            className="bg-[#16161a] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-colors"

        >

            <div className="flex items-center justify-between mb-3">

                <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center`}>

                    <Icon className={`w-5 h-5 ${color}`} />

                </div>

                {sub && <span className="text-[11px] text-zinc-500">{sub}</span>}

            </div>

            <p className="text-2xl font-bold text-white">{value}</p>

            <p className="text-zinc-500 text-[12px] mt-1">{label}</p>

        </motion.div>

    );

}



const fmtNum = (n: number) => {

    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';

    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';

    return n.toLocaleString('tr-TR');

};



export default function InstagramDetailPage() {

    const navigate = useNavigate();

    const { user } = useAuth();

    const companyId = user?.companyId;



    const [status, setStatus] = useState<IgStatusResponse | null>(null);

    const [data, setData] = useState<IgOverviewResponse | null>(null);

    const [reels, setReels] = useState<IgReelRow[]>([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const [datePreset, setDatePreset] = useState(2);

    const [showDatePicker, setShowDatePicker] = useState(false);



    const load = () => {

        if (!companyId) return;

        setLoading(true);

        setError(null);

        const { start, end } = DATE_PRESETS[datePreset];

        igApi.getStatus(companyId)

            .then(s => {

                setStatus(s);

                if (s.connected) {

                    return Promise.all([

                        igApi.getOverview(companyId, start, end).then(d => setData(d)),

                        igApi.getReels(companyId, 20).then(r => setReels(r)).catch(() => {}),

                    ]);

                }

            })

            .catch((err: { response?: { data?: { message?: string } } }) =>

                setError(err?.response?.data?.message || 'Bağlantı hatası')

            )

            .finally(() => setLoading(false));

    };



    useEffect(() => { load(); }, [companyId, datePreset]);



    useEffect(() => {

        const params = new URLSearchParams(window.location.search);

        if (params.get('ig') === 'connected') load();

    }, [companyId]);



    const handleDisconnect = async () => {

        if (!companyId) return;

        await igApi.disconnect(companyId);

        setData(null);

        load();

    };



    const growthRate = data && data.followersCount > 0

        ? ((data.followersGained - data.followersLost) / data.followersCount * 100).toFixed(2)

        : '0';



    const engagementRate = data && data.reach > 0

        ? ((data.totalLikes + data.totalComments) / data.reach * 100).toFixed(2)

        : '0';



    if (loading) {

        return (

            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">

                <div className="flex items-center gap-3">

                    <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />

                    <span className="text-zinc-400">Instagram verileri yükleniyor...</span>

                </div>

            </div>

        );

    }



    return (

        <div className="min-h-screen bg-[#09090b] p-4 md:p-6 lg:p-8">

            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                    <div className="flex items-center gap-4">

                        <button

                            onClick={() => navigate('/client/analytics')}

                            className="h-10 w-10 rounded-xl bg-[#16161a] border border-white/[0.06] flex items-center justify-center hover:bg-[#1e1e22] transition-colors"

                        >

                            <ArrowLeft className="w-5 h-5 text-zinc-400" />

                        </button>

                        <div className="flex items-center gap-3">

                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">

                                <Instagram className="w-6 h-6 text-pink-400" />

                            </div>

                            <div>

                                <h1 className="text-xl font-bold text-white">Instagram Analitik</h1>

                                <p className="text-sm text-zinc-500">

                                    {data?.username ? `@${data.username}` : status?.username ? `@${status.username}` : 'Detaylı istatistikler'}

                                    {' · '}{DATE_PRESETS[datePreset].desc}

                                </p>

                            </div>

                        </div>

                    </div>



                    <div className="flex items-center gap-2">

                        {/* Date picker */}

                        <div className="relative">

                            <button

                                onClick={() => setShowDatePicker(v => !v)}

                                className="flex items-center gap-2 bg-[#16161a] border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-4 py-2.5 transition-colors"

                            >

                                <Calendar className="w-4 h-4 text-zinc-500" />

                                <span className="text-sm text-zinc-300">{DATE_PRESETS[datePreset].label}</span>

                                <ChevronDown className="w-4 h-4 text-zinc-500" />

                            </button>

                            {showDatePicker && (

                                <>

                                    <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />

                                    <div className="absolute right-0 top-full mt-2 z-50 bg-[#16161a] border border-white/[0.08] rounded-xl shadow-2xl p-2 min-w-[200px]">

                                        {DATE_PRESETS.map((p, i) => (

                                            <button

                                                key={i}

                                                onClick={() => { setDatePreset(i); setShowDatePicker(false); }}

                                                className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${datePreset === i

                                                    ? 'bg-pink-500/10 text-pink-400'

                                                    : 'text-zinc-300 hover:bg-white/[0.05]'

                                                }`}

                                            >

                                                {p.label}

                                            </button>

                                        ))}

                                    </div>

                                </>

                            )}

                        </div>



                        {status?.connected && (

                            <>

                                <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 rounded-xl px-3 py-2.5">

                                    <CheckCircle2 className="w-4 h-4 text-pink-400" />

                                    <span className="text-xs text-pink-400 font-medium">Canlı</span>

                                </div>

                                <button

                                    onClick={handleDisconnect}

                                    title="Bağlantıyı Kes"

                                    className="h-10 w-10 rounded-xl bg-[#16161a] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"

                                >

                                    <LogOut className="w-4 h-4" />

                                </button>

                            </>

                        )}

                    </div>

                </div>



                {/* Error */}

                {error && (

                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">

                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />

                        <div>

                            <p className="text-sm font-medium text-red-400">Bağlantı Hatası</p>

                            <p className="text-xs text-red-400/60 mt-1">{error}</p>

                        </div>

                    </div>

                )}



                {/* Not connected */}

                {!status?.connected && !error && (

                    <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-12">

                        <div className="flex flex-col items-center text-center gap-6">

                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">

                                <Instagram className="w-8 h-8 text-pink-400" />

                            </div>

                            <div>

                                <h3 className="text-white font-semibold text-lg">Instagram Bağlı Değil</h3>

                                <p className="text-zinc-500 text-sm mt-2 max-w-md">

                                    Facebook hesabınızla giriş yaparak Instagram Business verilerinize erişin.

                                </p>

                            </div>

                            {status?.authUrl && (

                                <a

                                    href={status.authUrl}

                                    className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-sm font-medium px-6 py-3 rounded-xl transition-all"

                                >

                                    <Instagram className="w-4 h-4" />

                                    Instagram'ı Bağla

                                </a>

                            )}

                        </div>

                    </div>

                )}



                {/* Connected - show data */}

                {data && !data.errorMessage && (

                    <>

                        {/* Top metrics - row 1 */}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                            <BigMetricCard label="Toplam Takipçi" value={fmtNum(data.followersCount)} icon={Users} color="text-pink-400" bgColor="bg-pink-500/10" />

                            <BigMetricCard label="Takipçi Kazanımı" value={`+${fmtNum(data.followersGained)}`} icon={UserPlus} color="text-emerald-400" bgColor="bg-emerald-500/10" sub={data.followersLost > 0 ? `-${fmtNum(data.followersLost)} kayıp` : undefined} />

                            <BigMetricCard label="Büyüme Oranı" value={`%${growthRate}`} icon={TrendingUp} color="text-violet-400" bgColor="bg-violet-500/10" sub="Net takipçi değişimi" />

                            <BigMetricCard label="Etkileşim Oranı" value={`%${engagementRate}`} icon={BarChart3} color="text-amber-400" bgColor="bg-amber-500/10" sub="(Beğeni+Yorum) / Erişim" />

                        </div>



                        {/* Top metrics - row 2 */}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                            <BigMetricCard label="Görüntülenme" value={fmtNum(data.impressions)} icon={Eye} color="text-[#F5BEC8]" bgColor="bg-[#C8697A]/10" />

                            <BigMetricCard label="Erişim" value={fmtNum(data.reach)} icon={MousePointerClick} color="text-cyan-400" bgColor="bg-cyan-500/10" />

                            <BigMetricCard label="Profil Görüntüleme" value={fmtNum(data.profileViews)} icon={Eye} color="text-orange-400" bgColor="bg-orange-500/10" />

                            <BigMetricCard label="Site Tıklaması" value={fmtNum(data.websiteClicks)} icon={MousePointerClick} color="text-lime-400" bgColor="bg-lime-500/10" />

                        </div>



                        {/* Engagement row */}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                            <BigMetricCard label="Toplam Beğeni" value={fmtNum(data.totalLikes)} icon={Heart} color="text-rose-400" bgColor="bg-rose-500/10" />

                            <BigMetricCard label="Toplam Yorum" value={fmtNum(data.totalComments)} icon={MessageCircle} color="text-violet-400" bgColor="bg-violet-500/10" />

                            <BigMetricCard label="Takip Edilen" value={fmtNum(data.followsCount)} icon={Users} color="text-zinc-400" bgColor="bg-zinc-500/10" />

                            <BigMetricCard label="Paylaşım Sayısı" value={fmtNum(data.mediaCount)} icon={ImageIcon} color="text-pink-400" bgColor="bg-pink-500/10" />

                        </div>



                        {/* Charts row */}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Daily trend chart */}

                            {data.dailyTrend.length > 0 && (

                                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6">

                                    <div className="flex items-center gap-2 mb-5">

                                        <TrendingUp className="w-4 h-4 text-pink-400" />

                                        <h4 className="text-sm font-semibold text-white">Takipçi & Erişim Trendi</h4>

                                    </div>

                                    <ResponsiveContainer width="100%" height={280}>

                                        <AreaChart data={data.dailyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>

                                            <defs>

                                                <linearGradient id="igFollowersD" x1="0" y1="0" x2="0" y2="1">

                                                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />

                                                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />

                                                </linearGradient>

                                                <linearGradient id="igReachD" x1="0" y1="0" x2="0" y2="1">

                                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />

                                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />

                                                </linearGradient>

                                            </defs>

                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} interval="preserveStartEnd" />

                                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} />

                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} />

                                            <Tooltip content={<ChartTooltip />} />

                                            <Area yAxisId="left" type="monotone" dataKey="followers" stroke="#ec4899" strokeWidth={2} fill="url(#igFollowersD)" name="Takipçi" />

                                            <Area yAxisId="right" type="monotone" dataKey="reach" stroke="#06b6d4" strokeWidth={2} fill="url(#igReachD)" name="Erişim" />

                                        </AreaChart>

                                    </ResponsiveContainer>

                                </div>

                            )}



                            {/* Impressions trend */}

                            {data.dailyTrend.length > 0 && (

                                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6">

                                    <div className="flex items-center gap-2 mb-5">

                                        <Eye className="w-4 h-4 text-violet-400" />

                                        <h4 className="text-sm font-semibold text-white">Görüntülenme Trendi</h4>

                                    </div>

                                    <ResponsiveContainer width="100%" height={280}>

                                        <AreaChart data={data.dailyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>

                                            <defs>

                                                <linearGradient id="igImpressionsD" x1="0" y1="0" x2="0" y2="1">

                                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />

                                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />

                                                </linearGradient>

                                            </defs>

                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} interval="preserveStartEnd" />

                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} />

                                            <Tooltip content={<ChartTooltip />} />

                                            <Area type="monotone" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} fill="url(#igImpressionsD)" name="Görüntülenme" />

                                        </AreaChart>

                                    </ResponsiveContainer>

                                </div>

                            )}

                        </div>



                        {/* Reels carousel */}

                        {reels.length > 0 && (

                            <ReelsCarousel items={reels} />

                        )}



                    </>

                )}



                {/* Reconnect error */}

                {data?.errorMessage && (

                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">

                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />

                        <div className="flex-1">

                            <p className="text-sm font-medium text-red-400">Instagram bağlantısı kesildi</p>

                            <p className="text-xs text-red-400/60 mt-1">

                                Erişim izni geçersiz ya da iptal edilmiş. Lütfen yeniden bağlanın.

                            </p>

                        </div>

                        {status?.authUrl && (

                            <a

                                href={status.authUrl}

                                className="shrink-0 text-sm font-medium bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 rounded-xl px-4 py-2 transition-colors"

                            >

                                Yeniden Bağlan

                            </a>

                        )}

                    </div>

                )}



            </div>

        </div>

    );

}



// ============================================================================

// Media Carousel - "Son Paylaşımlar" premium carousel

// ============================================================================



interface ReelsCarouselProps {

    items: IgReelRow[];

}



function ReelsCarousel({ items }: ReelsCarouselProps) {

    const scrollRef = useRef<HTMLDivElement>(null);

    const [canPrev, setCanPrev] = useState(false);

    const [canNext, setCanNext] = useState(true);



    const updateArrows = () => {

        const el = scrollRef.current;

        if (!el) return;

        setCanPrev(el.scrollLeft > 8);

        setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);

    };



    useEffect(() => {

        updateArrows();

        const el = scrollRef.current;

        if (!el) return;

        el.addEventListener('scroll', updateArrows, { passive: true });

        window.addEventListener('resize', updateArrows);

        return () => {

            el.removeEventListener('scroll', updateArrows);

            window.removeEventListener('resize', updateArrows);

        };

    }, [items.length]);



    const scrollBy = (dir: 1 | -1) => {

        const el = scrollRef.current;

        if (!el) return;

        const card = el.querySelector<HTMLElement>('[data-media-card]');

        const step = card ? card.offsetWidth + 16 : 240;

        el.scrollBy({ left: dir * step * 2, behavior: 'smooth' });

    };



    return (

        <div className="fog-premium-card p-6">

            <div className="flex items-center gap-2 mb-5">

                <div

                    className="h-8 w-8 rounded-xl flex items-center justify-center"

                    style={{

                        background: 'linear-gradient(135deg, rgba(209,24,28,0.18), rgba(200,105,122,0.10))',

                        border: '1px solid rgba(200,105,122,0.22)'

                    }}

                >

                    <ImageIcon className="w-4 h-4 text-[#F5BEC8]" />

                </div>

                <div className="flex-1">

                    <h4 className="text-sm font-semibold text-white tracking-tight">Bu Ay Paylaşılan Reels'ler</h4>

                    <p className="text-[11px] text-zinc-500 mt-0.5">Üzerine gelip videoyu Instagram'da açabilirsiniz</p>

                </div>

                <span className="text-[11px] text-zinc-500">{items.length} paylaşım</span>



                <div className="flex items-center gap-1.5 ml-2">

                    <button

                        onClick={() => scrollBy(-1)}

                        disabled={!canPrev}

                        className="h-9 w-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-[#F5BEC8] hover:border-[#C8697A]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"

                        aria-label="Önceki"

                    >

                        <ChevronLeft className="w-4 h-4" />

                    </button>

                    <button

                        onClick={() => scrollBy(1)}

                        disabled={!canNext}

                        className="h-9 w-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-[#F5BEC8] hover:border-[#C8697A]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"

                        aria-label="Sonraki"

                    >

                        <ChevronRight className="w-4 h-4" />

                    </button>

                </div>

            </div>



            <div

                ref={scrollRef}

                className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"

                style={{ scrollbarWidth: 'none' }}

            >

                {items.map(m => (

                    <ReelCard key={m.id} item={m} />

                ))}

            </div>



            <style>{`

                .fog-premium-card > div:last-of-type::-webkit-scrollbar { display: none; }

            `}</style>

        </div>

    );

}



function ReelCard({ item }: { item: IgReelRow }) {

    return (

        <a

            data-media-card

            href={item.permalink}

            target="_blank"

            rel="noopener noreferrer"

            className="group relative shrink-0 w-[200px] md:w-[220px] snap-start rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0A0A0C] hover:border-[#C8697A]/40 transition-all"

            style={{ boxShadow: '0 4px 24px -8px rgba(0,0,0,0.6)' }}

        >

            {/* 9:16 reels aspect */}

            <div className="relative w-full" style={{ aspectRatio: '9 / 16' }}>

                {item.thumbnailUrl ? (

                    <img

                        src={item.thumbnailUrl}

                        alt=""

                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"

                    />

                ) : (

                    <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">

                        <ImageIcon className="w-8 h-8 text-zinc-700" />

                    </div>

                )}



                {/* Reels badge */}

                <div className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/15">

                    <Play className="w-3 h-3 text-white fill-white ml-0.5" />

                </div>



                {/* Default: metrics overlay (fades out on hover) */}

                <div

                    className="absolute inset-x-0 bottom-0 p-3 pt-10 transition-opacity duration-300 group-hover:opacity-0"

                    style={{

                        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 70%)'

                    }}

                >

                    <div className="flex items-center gap-3 mb-1.5">

                        <div className="flex items-center gap-1 text-white text-[12px] font-semibold">

                            <Eye className="w-3.5 h-3.5 text-[#F5BEC8]" />

                            {fmtNum(item.plays)}

                        </div>

                        <div className="flex items-center gap-1 text-white text-[12px] font-semibold">

                            <Heart className="w-3.5 h-3.5 text-[#F5BEC8] fill-[#F5BEC8]" />

                            {fmtNum(item.likeCount)}

                        </div>

                        <div className="flex items-center gap-1 text-white text-[12px] font-semibold">

                            <MessageCircle className="w-3.5 h-3.5 text-[#F5BEC8]" />

                            {fmtNum(item.commentsCount)}

                        </div>

                    </div>

                    <p className="text-[10px] text-zinc-400 line-clamp-2 leading-snug">

                        {item.caption?.substring(0, 80) || 'Açıklama yok'}

                    </p>

                </div>



                {/* Hover: "Videoyu Gör" CTA (scales in) */}

                <div

                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"

                    style={{

                        background: 'linear-gradient(180deg, rgba(10,10,12,0.35) 0%, rgba(10,10,12,0.75) 100%)',

                        backdropFilter: 'blur(2px)'

                    }}

                >

                    <div

                        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-[13px] font-semibold transform scale-90 group-hover:scale-100 transition-transform duration-300"

                        style={{

                            background: 'linear-gradient(135deg, #D1181C 0%, #C8697A 100%)',

                            boxShadow: '0 10px 30px -8px rgba(209,24,28,0.6), 0 0 0 1px rgba(255,255,255,0.12) inset'

                        }}

                    >

                        <ExternalLink className="w-3.5 h-3.5" />

                        Videoyu Gör

                    </div>

                </div>

            </div>



            {/* Footer: date */}

            <div className="px-3 py-2 border-t border-white/[0.05] bg-[#09090b]">

                <p className="text-[10px] text-zinc-500 flex items-center gap-1">

                    <Calendar className="w-3 h-3" />

                    {new Date(item.timestamp).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}

                </p>

            </div>

        </a>

    );

}



