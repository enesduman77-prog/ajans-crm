import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, RefreshCw, Smartphone, Monitor, Gauge,
    Zap, Shield, Search, Code, Clock, AlertCircle,
    CheckCircle2, TrendingUp, Info, ExternalLink, Loader2,
} from 'lucide-react';
import { webDesignApi, type PageSpeedReport, type PageSpeedScore } from '../../api/webDesign';

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

function scoreLabel(s?: number | null): string {
    if (s == null) return '—';
    if (s >= 90) return 'İyi';
    if (s >= 50) return 'Geliştirilmeli';
    return 'Kritik';
}

function scoreColorClass(s?: number | null): string {
    if (s == null) return 'text-zinc-500';
    if (s >= 90) return 'text-emerald-400';
    if (s >= 50) return 'text-amber-400';
    return 'text-red-400';
}

function scoreBgClass(s?: number | null): string {
    if (s == null) return 'bg-zinc-800/50 border-zinc-700/50';
    if (s >= 90) return 'bg-emerald-500/8 border-emerald-500/20';
    if (s >= 50) return 'bg-amber-500/8 border-amber-500/20';
    return 'bg-red-500/8 border-red-500/20';
}

function ScoreRing({ score, size = 80 }: { score?: number | null; size?: number }) {
    const radius = size / 2 - 7;
    const circ = 2 * Math.PI * radius;
    const offset = circ - ((score ?? 0) / 100) * circ;
    const color = score == null ? '#3f3f46' : score >= 90 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';

    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            {score != null && (
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={color} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    className="transition-all duration-700" />
            )}
        </svg>
    );
}

function vitalStatus(key: string, value?: number | null): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
    if (value == null) return 'unknown';
    switch (key) {
        case 'lcp': return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
        case 'fcp': return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
        case 'tbt': return value <= 200 ? 'good' : value <= 600 ? 'needs-improvement' : 'poor';
        case 'cls': return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
        default: return 'unknown';
    }
}

const statusStyle: Record<string, { text: string; bg: string; border: string; label: string }> = {
    good: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'İyi' },
    'needs-improvement': { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Geliştirilmeli' },
    poor: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Kritik' },
    unknown: { text: 'text-zinc-500', bg: 'bg-zinc-800/50', border: 'border-zinc-700/50', label: '—' },
};

function fmt(ms?: number | null, unit: 'ms' | 'cls' = 'ms'): string {
    if (ms == null) return '—';
    if (unit === 'cls') return ms.toFixed(3);
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)} sn` : `${Math.round(ms)} ms`;
}

// ─── Score Card ───────────────────────────────────────────────────────────────

function ScoreCard({ title, desc, score, icon: Icon, delay }: {
    title: string; desc: string; score?: number | null;
    icon: React.ElementType; delay: number;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay * 0.08 }}
            className={`rounded-2xl border p-5 ${scoreBgClass(score)}`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl bg-white/[0.04] flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${scoreColorClass(score)}`} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${scoreBgClass(score)} ${scoreColorClass(score)}`}>
                    {scoreLabel(score)}
                </span>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">{title}</p>
                    <p className={`text-4xl font-bold ${scoreColorClass(score)}`}>{score ?? '—'}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">/ 100</p>
                </div>
                <ScoreRing score={score} size={72} />
            </div>
            <p className="text-xs text-zinc-400 mt-4 leading-relaxed border-t border-white/[0.04] pt-3">{desc}</p>
        </motion.div>
    );
}

// ─── Vital Row ────────────────────────────────────────────────────────────────

function VitalRow({ label, hint, value, vKey, displayValue }: {
    label: string; hint: string; value?: number | null;
    vKey: string; displayValue: string;
}) {
    const st = vitalStatus(vKey, value);
    const s = statusStyle[st];
    const thresholds: Record<string, string> = {
        lcp: 'İyi: < 2.5 sn · Orta: 2.5–4 sn · Kötü: > 4 sn',
        fcp: 'İyi: < 1.8 sn · Orta: 1.8–3 sn · Kötü: > 3 sn',
        tbt: 'İyi: < 200 ms · Orta: 200–600 ms · Kötü: > 600 ms',
        cls: 'İyi: < 0.10 · Orta: 0.10–0.25 · Kötü: > 0.25',
    };
    return (
        <div className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{hint}</p>
                </div>
                <div className="text-right">
                    <p className={`text-xl font-bold ${s.text}`}>{displayValue}</p>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${s.text}`}>{s.label}</span>
                </div>
            </div>
            {thresholds[vKey] && (
                <p className="text-[10px] text-zinc-600 pt-2 border-t border-white/[0.04]">{thresholds[vKey]}</p>
            )}
        </div>
    );
}

// ─── Ana sayfa ─────────────────────────────────────────────────────────────────

type Strategy = 'mobile' | 'desktop';

export default function PageSpeedDetailPage() {
    const navigate = useNavigate();
    const [report, setReport] = useState<PageSpeedReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [strategy, setStrategy] = useState<Strategy>('mobile');

    const fetch = async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        try {
            const data = await webDesignApi.getMyPageSpeed(refresh);
            setReport(data);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const score: PageSpeedScore | undefined = strategy === 'mobile' ? report?.mobile : report?.desktop;

    const lastChecked = score?.fetchedAt
        ? new Date(score.fetchedAt).toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[#F5BEC8] animate-spin" />
                    <p className="text-zinc-400 text-sm">Site skorları yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (score?.fetchError) {
        return (
            <div className="space-y-6">
                <button onClick={() => navigate('/client/analytics')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Analitiğe Dön
                </button>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="w-10 h-10 text-amber-400" />
                    <div>
                        <p className="text-lg font-semibold text-white">Site Skoru Alınamadı</p>
                        <p className="text-sm text-zinc-500 mt-1 max-w-md">{score.fetchError}</p>
                    </div>
                    <button onClick={() => navigate('/client/analytics')}
                        className="bg-[#C8697A] hover:bg-[#B5556A] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                        Analitiğe Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <button onClick={() => navigate('/client/analytics')}
                        className="h-10 w-10 mt-0.5 rounded-xl bg-[#0C0C0E] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/[0.12] transition-all flex-shrink-0">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Gauge className="w-6 h-6 text-[#F5BEC8]" />
                            Web Sitesi Sağlık Raporu
                        </h1>
                        {report?.websiteUrl && (
                            <a href={report.websiteUrl.startsWith('http') ? report.websiteUrl : `https://${report.websiteUrl}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mt-1 transition-colors">
                                {report.websiteUrl}
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                        {lastChecked && (
                            <p className="text-[11px] text-zinc-600 mt-1">Son ölçüm: {lastChecked}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Mobil / Masaüstü toggle */}
                    <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5">
                        <button
                            onClick={() => setStrategy('mobile')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${strategy === 'mobile' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                            <Smartphone className="w-3.5 h-3.5" /> Mobil
                        </button>
                        <button
                            onClick={() => setStrategy('desktop')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${strategy === 'desktop' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                            <Monitor className="w-3.5 h-3.5" /> Masaüstü
                        </button>
                    </div>
                    <button onClick={() => fetch(true)} disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0C0C0E] border border-white/[0.06] text-sm text-zinc-400 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Yenile
                    </button>
                </div>
            </div>

            {/* ── Özet bilgi ── */}
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#C8697A]/10 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-[#F5BEC8]" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">Bu rapor ne anlama geliyor?</p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                        Google'ın PageSpeed aracı sitenizi gerçek bir ziyaretçi gibi ziyaret ederek dört farklı alanda puan verir.
                        <span className="text-emerald-400 font-medium"> 90–100 arası iyi</span>,
                        <span className="text-amber-400 font-medium"> 50–89 arası geliştirilmeli</span>,
                        <span className="text-red-400 font-medium"> 50 altı kritik</span> anlamına gelir.
                        Puanlar doğrudan Google sıralamanızı, ziyaretçi memnuniyetini ve satış dönüşümünü etkiler.
                    </p>
                </div>
            </div>

            {/* ── 4 Skor kartı ── */}
            <section>
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Genel Puanlar</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ScoreCard
                        title="Hız"
                        desc="Sitenizin ne kadar hızlı yüklendiği. Yavaş yüklenen siteler ziyaretçileri kaçırır — her 1 saniye gecikme dönüşümleri yaklaşık %7 düşürür."
                        score={score?.performance}
                        icon={Zap}
                        delay={0}
                    />
                    <ScoreCard
                        title="Erişilebilirlik"
                        desc="Sitenizin görme güçlüğü çekenler dahil tüm kullanıcılar için ne kadar kullanışlı olduğu. Yasal gereklilik ve daha geniş kitleye ulaşma."
                        score={score?.accessibility}
                        icon={Shield}
                        delay={1}
                    />
                    <ScoreCard
                        title="SEO"
                        desc="Google'ın sitenizi ne kadar iyi anlayabildiği ve dizine ekleyebildiği. Yüksek puan = daha üst arama sıralaması = daha fazla ücretsiz ziyaretçi."
                        score={score?.seo}
                        icon={Search}
                        delay={2}
                    />
                    <ScoreCard
                        title="Teknik Kalite"
                        desc="Sitenizin modern web standartlarına ve güvenlik gerekliliklerine ne kadar uyduğu. Güvenilirlik ve kullanıcı güveni için önemli."
                        score={score?.bestPractices}
                        icon={Code}
                        delay={3}
                    />
                </div>
            </section>

            {/* ── Core Web Vitals ── */}
            <section>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Hız Detayları</h2>
                    <span className="text-[11px] text-zinc-500">Google'ın resmi sıralama kriterleri</span>
                </div>
                <p className="text-xs text-zinc-500 mb-4">
                    Bu değerler, ziyaretçilerinizin sitenizde ne hissettiğini ölçer. Google bu değerleri
                    arama sıralamasında doğrudan kullanmaktadır.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <VitalRow
                        label="LCP — Ana İçerik Yüklenme"
                        hint="Sayfadaki en büyük görsel veya metin bloğunun ekrana gelmesi"
                        value={score?.lcpMs}
                        vKey="lcp"
                        displayValue={fmt(score?.lcpMs)}
                    />
                    <VitalRow
                        label="FCP — İlk İçerik Görünümü"
                        hint="Ziyaretçinin sayfada ilk bir şey gördüğü an"
                        value={score?.fcpMs}
                        vKey="fcp"
                        displayValue={fmt(score?.fcpMs)}
                    />
                    <VitalRow
                        label="TBT — Tıklama Tepki Gecikmesi"
                        hint="Sayfa yüklenirken butona basınca ne kadar gecikmeli yanıt alınıyor"
                        value={score?.tbtMs}
                        vKey="tbt"
                        displayValue={fmt(score?.tbtMs)}
                    />
                    <VitalRow
                        label="CLS — Sayfa Kayma Skoru"
                        hint="Yüklenirken içerikler ne kadar sıçrıyor / kayıyor"
                        value={score?.clsValue}
                        vKey="cls"
                        displayValue={fmt(score?.clsValue, 'cls')}
                    />
                </div>
            </section>

            {/* ── Neden önemli ── */}
            <section>
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#F5BEC8]" />
                        Bu Puanlar İşinizi Nasıl Etkiler?
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                icon: Search,
                                color: 'text-blue-400',
                                bg: 'bg-blue-500/10',
                                title: 'Google Sıralaması',
                                desc: 'Google, hızlı ve kaliteli siteleri daha üst sıralarda gösterir. Yüksek skor = daha fazla ücretsiz organik trafik.'
                            },
                            {
                                icon: Clock,
                                color: 'text-amber-400',
                                bg: 'bg-amber-500/10',
                                title: 'Ziyaretçi Kaybı',
                                desc: 'Araştırmalar, 3 saniyeden yavaş yüklenen sitelerin ziyaretçilerinin %53\'ünü kaybettiğini gösteriyor.'
                            },
                            {
                                icon: CheckCircle2,
                                color: 'text-emerald-400',
                                bg: 'bg-emerald-500/10',
                                title: 'Satış Dönüşümü',
                                desc: '0.1 saniyelik hız iyileştirmesi, perakende sitelerinde dönüşümleri ortalama %8 artırıyor.'
                            },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-3">
                                <div className={`h-9 w-9 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                    <item.icon className={`w-4 h-4 ${item.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{item.title}</p>
                                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Ajans notu ── */}
            <div className="bg-[#C8697A]/5 border border-[#C8697A]/15 rounded-2xl p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#C8697A]/10 flex items-center justify-center flex-shrink-0">
                    <Gauge className="w-5 h-5 text-[#F5BEC8]" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-[#F5BEC8]">Ajansınız Takip Ediyor</p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        FOG İstanbul ekibi bu metrikleri düzenli olarak takip etmekte ve gerektiğinde iyileştirme çalışmaları yapmaktadır.
                        Sorularınız için ekibinizle iletişime geçebilirsiniz.
                    </p>
                </div>
            </div>
        </div>
    );
}
