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
    CheckCircle2, ChevronDown, Calendar,
    Image as ImageIcon, LogOut, Play, ChevronLeft, ChevronRight, Share2
} from 'lucide-react';
import { igApi, type IgOverviewResponse, type IgStatusResponse, type IgReelRow } from '../../api/instagram';

interface Props {
    companyId: string;
}

interface DatePreset {
    label: string;
    start: string;
    end: string;
}

const DATE_PRESETS: DatePreset[] = [
    { label: 'Son 7 Gün', start: '7daysAgo', end: 'today' },
    { label: 'Son 14 Gün', start: '14daysAgo', end: 'today' },
    { label: 'Son 30 Gün', start: '30daysAgo', end: 'today' },
    { label: 'Son 90 Gün', start: '90daysAgo', end: 'today' },
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

const fmtNum = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
};

export default function InstagramPanel({ companyId }: Props) {
    const [status, setStatus] = useState<IgStatusResponse | null>(null);
    const [data, setData] = useState<IgOverviewResponse | null>(null);
    const [reels, setReels] = useState<IgReelRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [datePreset, setDatePreset] = useState(2);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [reelPage, setReelPage] = useState(0);
    const navigate = useNavigate();

    const load = () => {
        setLoading(true);
        setError(null);
        const startDate = DATE_PRESETS[datePreset].start;
        const endDate = DATE_PRESETS[datePreset].end;
        igApi.getStatus(companyId)
            .then((s: IgStatusResponse) => {
                setStatus(s);
                if (s.connected) {
                    return Promise.all([
                        igApi.getOverview(companyId, startDate, endDate).then(d => setData(d)),
                        igApi.getReels(companyId, 10).then(r => setReels(r)),
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
        await igApi.disconnect(companyId);
        setData(null);
        load();
    };

    if (loading) {
        return (
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-8 flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                <span className="text-zinc-400 text-sm">Instagram yükleniyor...</span>
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

    // Yapılandırılmamış
    if (!status?.configured) {
        return (
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-8">
                <div className="flex flex-col items-center text-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                        <Instagram className="w-7 h-7 text-zinc-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">Instagram Entegrasyonu</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                            Instagram entegrasyonu henüz yapılandırılmamış.
                            Lütfen yöneticinizle iletişime geçin.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Bağlı değil
    if (!status?.connected) {
        return (
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-8">
                <div className="flex flex-col items-center text-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                        <Instagram className="w-7 h-7 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">Instagram Bağlı Değil</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                            Facebook hesabınızla giriş yaparak Instagram Business verilerinize erişin.
                        </p>
                    </div>
                    {status.authUrl && (
                        <a
                            href={status.authUrl}
                            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
                        >
                            <Instagram className="w-4 h-4" />
                            Instagram'ı Bağla
                        </a>
                    )}
                    <p className="text-[11px] text-zinc-600 max-w-sm">
                        Not: Instagram Business veya Creator hesabınızın bir Facebook sayfasına bağlı olması gerekmektedir.
                    </p>
                </div>
            </div>
        );
    }

    // Bağlı ve veri var
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                        <Instagram className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Instagram</h3>
                        <p className="text-[11px] text-zinc-500">@{data?.username || status.username} — {DATE_PRESETS[datePreset].label}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Tarih seçici */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDatePicker(v => !v)}
                            className="flex items-center gap-1.5 bg-[#1a1a1f] border border-white/[0.06] hover:border-white/[0.12] rounded-full px-2.5 py-1 transition-colors"
                        >
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            <span className="text-[11px] text-zinc-400">{DATE_PRESETS[datePreset].label}</span>
                            <ChevronDown className="w-3 h-3 text-zinc-500" />
                        </button>
                        {showDatePicker && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                                <div className="absolute right-0 top-full mt-2 z-50 bg-[#1a1a1f] border border-white/[0.08] rounded-xl shadow-2xl p-2 min-w-[180px]">
                                    {DATE_PRESETS.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setDatePreset(i); setShowDatePicker(false); }}
                                            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                                datePreset === i
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
                    <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full px-3 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-[11px] text-pink-400 font-medium">Canlı</span>
                    </div>
                    <button onClick={handleDisconnect} title="Bağlantıyı Kes"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Hata */}
            {data?.errorMessage && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs font-medium text-red-400">Instagram bağlantısı kesildi</p>
                        <p className="text-[11px] text-red-400/60 mt-0.5">
                            Erişim izni geçersiz ya da iptal edilmiş. Lütfen yeniden bağlanın.
                        </p>
                    </div>
                    {status?.authUrl && (
                        <a
                            href={status.authUrl}
                            className="shrink-0 text-[11px] font-medium bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 rounded-lg px-3 py-1.5 transition-colors"
                        >
                            Yeniden Bağlan
                        </a>
                    )}
                </div>
            )}

            {/* Metrikler */}
            {data && !data.errorMessage && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricCard label="Takipçi" value={fmtNum(data.followersCount)} icon={Users} color="text-pink-400" bgColor="bg-pink-500/10" />
                        <MetricCard label="Takipçi Kazanımı" value={"+" + fmtNum(data.followersGained)} icon={UserPlus} color="text-pink-400" bgColor="bg-pink-500/10" sub={data.followersLost > 0 ? "-" + fmtNum(data.followersLost) + " kayıp" : undefined} />
                        <MetricCard label="Görüntülenme" value={fmtNum(data.impressions)} icon={Eye} color="text-blue-400" bgColor="bg-blue-500/10" />
                        <MetricCard label="Erişim" value={fmtNum(data.reach)} icon={MousePointerClick} color="text-amber-400" bgColor="bg-amber-500/10" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricCard label="Toplam Beğeni" value={fmtNum(data.totalLikes)} icon={Heart} color="text-rose-400" bgColor="bg-rose-500/10" sub="Son paylaşımlar" />
                        <MetricCard label="Toplam Yorum" value={fmtNum(data.totalComments)} icon={MessageCircle} color="text-violet-400" bgColor="bg-violet-500/10" />
                        <MetricCard label="Profil Görüntüleme" value={fmtNum(data.profileViews)} icon={Eye} color="text-cyan-400" bgColor="bg-cyan-500/10" />
                        <MetricCard label="Paylaşım Sayısı" value={fmtNum(data.mediaCount)} icon={ImageIcon} color="text-orange-400" bgColor="bg-orange-500/10" />
                    </div>

                    {/* Reels Carousel */}
                    {reels.length > 0 && (() => {
                        const perPage = 3;
                        const maxPage = Math.max(0, Math.ceil(reels.length / perPage) - 1);
                        const visibleReels = reels.slice(reelPage * perPage, reelPage * perPage + perPage);

                        const formatDate = (ts: string) => {
                            try {
                                const d = new Date(ts);
                                return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
                            } catch { return ts; }
                        };

                        return (
                            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                                            <Play className="w-3.5 h-3.5 text-pink-400" />
                                        </div>
                                        <h4 className="text-sm font-semibold text-white">Bu Ay Paylaşılan Reels'ler</h4>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setReelPage(p => Math.max(0, p - 1))}
                                            disabled={reelPage === 0}
                                            className="h-7 w-7 rounded-lg border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setReelPage(p => Math.min(maxPage, p + 1))}
                                            disabled={reelPage >= maxPage}
                                            className="h-7 w-7 rounded-lg border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {visibleReels.map(reel => {
                                        const ReelFallback = () => (
                                            <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16162a] to-[#0f0f1a] flex flex-col items-center justify-center gap-3">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-600/30 border border-white/[0.08] flex items-center justify-center">
                                                    <Play className="w-5 h-5 text-white/60 ml-0.5" />
                                                </div>
                                                <span className="text-[11px] text-zinc-500 font-medium">Instagram'da İzle</span>
                                            </div>
                                        );

                                        return (
                                            <a
                                                key={reel.id}
                                                href={reel.permalink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group bg-[#16161a] border border-white/[0.06] rounded-xl overflow-hidden hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/5 transition-all"
                                            >
                                                {/* Thumbnail */}
                                                <div className="relative aspect-[9/14] bg-[#111114]">
                                                    {reel.thumbnailUrl ? (
                                                        <>
                                                            <img
                                                                src={reel.thumbnailUrl}
                                                                alt={reel.caption || 'Reels'}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const target = e.currentTarget;
                                                                    target.style.display = 'none';
                                                                    target.nextElementSibling?.classList.remove('hidden');
                                                                }}
                                                            />
                                                            <div className="hidden w-full h-full">
                                                                <ReelFallback />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <ReelFallback />
                                                    )}
                                                    {/* Play icon overlay — sadece resim varken */}
                                                    {reel.thumbnailUrl && (
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                                                            <div className="h-11 w-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/[0.15] flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Play className="w-4.5 h-4.5 text-white ml-0.5" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Caption & date */}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-10">
                                                        <p className="text-white text-xs font-semibold line-clamp-2 leading-relaxed drop-shadow-lg">
                                                            {reel.caption || 'Reels'}
                                                        </p>
                                                        <p className="text-zinc-400 text-[10px] mt-1 drop-shadow">{formatDate(reel.timestamp)}</p>
                                                    </div>
                                                    {/* Instagram badge */}
                                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                                                        <Instagram className="w-3 h-3 text-pink-400" />
                                                        <span className="text-[9px] text-white/70 font-medium">Reels</span>
                                                    </div>
                                                </div>

                                                {/* Metrics bar */}
                                                <div className="flex items-center justify-between px-3 py-2.5 border-t border-white/[0.04]">
                                                    <div className="flex items-center gap-1.5 text-zinc-400" title="Görüntülenme">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span className="text-[11px] font-medium">{fmtNum(reel.plays)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-pink-400" title="Beğeni">
                                                        <Heart className="w-3.5 h-3.5" />
                                                        <span className="text-[11px] font-medium">{fmtNum(reel.likeCount)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-400" title="Yorum">
                                                        <MessageCircle className="w-3.5 h-3.5" />
                                                        <span className="text-[11px] font-medium">{fmtNum(reel.commentsCount)}</span>
                                                    </div>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Günlük trend */}
                    {data.dailyTrend.length > 0 && (
                        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-4 h-4 text-pink-400" />
                                <h4 className="text-sm font-semibold text-white">Takipçi & Görüntülenme Trendi</h4>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={data.dailyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="igFollowers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="igImpressions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} interval={4} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area yAxisId="left" type="monotone" dataKey="followers" stroke="#ec4899" strokeWidth={2} fill="url(#igFollowers)" name="Takipçi" />
                                    <Area yAxisId="right" type="monotone" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} fill="url(#igImpressions)" name="Görüntülenme" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Detaylı İncele */}
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={() => navigate('/client/instagram')}
                            className="text-[12px] text-pink-400 hover:text-pink-300 font-medium transition-colors"
                        >
                            Detaylı İncele →
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
}
