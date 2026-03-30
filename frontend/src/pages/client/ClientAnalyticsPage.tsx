import {
    Users, Eye, MousePointerClick, TrendingUp, Globe,
    Instagram, Search, BarChart3, Activity, Share2,
    Heart, MessageCircle, UserPlus, ArrowUpRight
} from 'lucide-react';
import { StatCard, AreaChartCard, BarChartCard, DonutChartCard, LineChartCard, MiniTrend, HeatmapCard, GoogleAnalyticsPanel } from '../../components/analytics';
import { useAuth } from '../../store/AuthContext';

// Mock data - Faz 6'da gerçek API entegrasyonlarıyla değiştirilecek

const websiteTraffic = [
    { name: 'Oca', ziyaretçi: 8420, sayfaGörüntüleme: 24800 },
    { name: 'Şub', ziyaretçi: 9150, sayfaGörüntüleme: 27300 },
    { name: 'Mar', ziyaretçi: 10800, sayfaGörüntüleme: 32100 },
    { name: 'Nis', ziyaretçi: 11200, sayfaGörüntüleme: 33400 },
    { name: 'May', ziyaretçi: 12458, sayfaGörüntüleme: 37200 },
    { name: 'Haz', ziyaretçi: 13900, sayfaGörüntüleme: 41500 },
    { name: 'Tem', ziyaretçi: 14200, sayfaGörüntüleme: 42800 },
    { name: 'Ağu', ziyaretçi: 12800, sayfaGörüntüleme: 38400 },
    { name: 'Eyl', ziyaretçi: 15600, sayfaGörüntüleme: 46800 },
    { name: 'Eki', ziyaretçi: 16200, sayfaGörüntüleme: 48600 },
    { name: 'Kas', ziyaretçi: 17800, sayfaGörüntüleme: 53400 },
    { name: 'Ara', ziyaretçi: 15400, sayfaGörüntüleme: 46200 },
];

const trafficSources = [
    { name: 'Organik Arama', value: 42, color: '#10b981' },
    { name: 'Sosyal Medya', value: 28, color: '#3b82f6' },
    { name: 'Direkt', value: 18, color: '#f97316' },
    { name: 'Referans', value: 8, color: '#8b5cf6' },
    { name: 'E-posta', value: 4, color: '#ec4899' },
];

const instagramGrowth = [
    { name: 'Oca', takipçi: 4200, etkileşim: 320 },
    { name: 'Şub', takipçi: 4580, etkileşim: 410 },
    { name: 'Mar', takipçi: 5100, etkileşim: 480 },
    { name: 'Nis', takipçi: 5800, etkileşim: 520 },
    { name: 'May', takipçi: 6400, etkileşim: 610 },
    { name: 'Haz', takipçi: 7200, etkileşim: 580 },
];

const searchPerformance = [
    { name: 'Oca', gösterim: 45000, tıklama: 1800 },
    { name: 'Şub', gösterim: 52000, tıklama: 2100 },
    { name: 'Mar', gösterim: 61000, tıklama: 2600 },
    { name: 'Nis', gösterim: 58000, tıklama: 2400 },
    { name: 'May', gösterim: 72000, tıklama: 3200 },
    { name: 'Haz', gösterim: 68000, tıklama: 2900 },
];

const topPages = [
    { name: 'Ana Sayfa', views: 12400 },
    { name: 'Hizmetler', views: 8200 },
    { name: 'Hakkımızda', views: 5600 },
    { name: 'Blog', views: 4800 },
    { name: 'İletişim', views: 3200 },
    { name: 'Portföy', views: 2800 },
];

const heatmapData = (() => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const hours = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];
    const data: Array<{ day: string; hour: string; value: number }> = [];
    days.forEach(day => {
        hours.forEach(hour => {
            const isWeekend = day === 'Cmt' || day === 'Paz';
            const peakHour = parseInt(hour) >= 11 && parseInt(hour) <= 15;
            const base = isWeekend ? 20 : 50;
            const peak = peakHour ? 40 : 0;
            data.push({ day, hour, value: Math.floor(Math.random() * 30) + base + peak });
        });
    });
    return data;
})();

export default function ClientAnalyticsPage() {
    const { user } = useAuth();

    const mainStats = [
        { label: 'Toplam Ziyaretçi', value: '158K', change: '+12.5%', icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { label: 'Sayfa Görüntüleme', value: '472K', change: '+8.3%', icon: Eye, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
        { label: 'Tıklama Oranı', value: '%3.8', change: '+0.4%', icon: MousePointerClick, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
        { label: 'Dönüşüm', value: '2,842', change: '+15.2%', icon: TrendingUp, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
    ];

    const instagramStats = [
        { label: 'Takipçi', value: '7.2K', change: '+840', icon: UserPlus, color: 'text-pink-400', bgColor: 'bg-pink-500/10', sparkData: [4200, 4580, 5100, 5800, 6400, 7200] },
        { label: 'Etkileşim Oranı', value: '%4.8', change: '+0.6%', icon: Heart, color: 'text-red-400', bgColor: 'bg-red-500/10', sparkData: [3.2, 3.8, 4.1, 3.9, 4.4, 4.8] },
        { label: 'Ortalama Beğeni', value: '342', change: '+18%', icon: Heart, color: 'text-rose-400', bgColor: 'bg-rose-500/10', sparkData: [220, 248, 285, 310, 328, 342] },
        { label: 'Yorumlar', value: '89', change: '+12', icon: MessageCircle, color: 'text-violet-400', bgColor: 'bg-violet-500/10', sparkData: [42, 56, 62, 71, 78, 89] },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Raporlar & Analitik</h1>
                    <p className="text-zinc-500 text-[13px] mt-1">Şirketinizin dijital performans metrikleri</p>
                </div>
                <div className="flex items-center gap-2 bg-[#111113] border border-white/[0.06] rounded-xl px-3 py-2 self-start">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-zinc-400">Canlı Veriler</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
            </div>

            {/* ═══ WEBSITE ANALYTICS ═══ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Web Sitesi</h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {mainStats.map((stat, i) => (
                        <StatCard key={stat.label} {...stat} delay={i} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <AreaChartCard
                            title="Aylık Trafik"
                            icon={TrendingUp}
                            data={websiteTraffic}
                            dataKey="ziyaretçi"
                            secondaryDataKey="sayfaGörüntüleme"
                            color="#3b82f6"
                            secondaryColor="#10b981"
                            gradientId="webTraffic"
                        />
                    </div>
                    <DonutChartCard
                        title="Trafik Kaynakları"
                        icon={Share2}
                        iconColor="text-blue-400"
                        data={trafficSources}
                        centerLabel="Kaynak"
                        centerValue="5"
                    />
                </div>
            </section>

            {/* ═══ TOP PAGES + HEATMAP ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarChartCard
                    title="En Çok Ziyaret Edilen Sayfalar"
                    icon={BarChart3}
                    iconColor="text-blue-400"
                    data={topPages}
                    dataKey="views"
                    color="#3b82f6"
                    barColors={['#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']}
                />
                <HeatmapCard
                    title="Ziyaretçi Yoğunluk Haritası"
                    icon={Activity}
                    data={heatmapData}
                    color="#3b82f6"
                />
            </div>

            {/* ═══ INSTAGRAM ═══ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Instagram</h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {instagramStats.map((stat) => (
                        <MiniTrend key={stat.label} {...stat} />
                    ))}
                </div>

                <AreaChartCard
                    title="Takipçi Büyümesi & Etkileşim"
                    icon={TrendingUp}
                    iconColor="text-pink-400"
                    data={instagramGrowth}
                    dataKey="takipçi"
                    secondaryDataKey="etkileşim"
                    color="#ec4899"
                    secondaryColor="#a855f7"
                    gradientId="instagram"
                />
            </section>

            {/* ═══ SEARCH CONSOLE ═══ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Google Search Console</h2>
                </div>

                <LineChartCard
                    title="Arama Performansı"
                    icon={Search}
                    iconColor="text-emerald-400"
                    data={searchPerformance}
                    lines={[
                        { dataKey: 'gösterim', color: '#10b981', name: 'Gösterim' },
                        { dataKey: 'tıklama', color: '#f97316', name: 'Tıklama' },
                    ]}
                />
            </section>

            {/* ═══ GOOGLE ANALYTICS ═══ */}
            {user?.companyId && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Google Analytics</h2>
                    </div>
                    <GoogleAnalyticsPanel companyId={user.companyId} />
                </section>
            )}

            {/* Info Banner */}
            <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-orange-300">Canlı Veri Entegrasyonu</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                        API entegrasyonları tamamlandığında bu grafiklerde gerçek zamanlı verilerinizi takip edebileceksiniz —
                        Google Analytics, Search Console, Instagram ve Google Ads.
                    </p>
                </div>
            </div>
        </div>
    );
}
