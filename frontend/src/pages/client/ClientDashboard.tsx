import { BarChart3, TrendingUp, Users, Eye, MousePointerClick, ArrowUpRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

const mockStats = [
    { label: 'Toplam Ziyaretçi', value: '12,458', change: '+12.5%', icon: Users },
    { label: 'Sayfa Görüntüleme', value: '48,392', change: '+8.3%', icon: Eye },
    { label: 'Tıklama Oranı', value: '%3.2', change: '+0.4%', icon: MousePointerClick },
    { label: 'Dönüşüm', value: '342', change: '+15.2%', icon: TrendingUp },
];

export default function ClientDashboard() {
    const { user } = useAuth();
    const hour = new Date().getHours();
    const greeting = hour < 6 ? 'Hayırlı geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
    const firstName = user?.fullName?.split(' ')[0] || '';

    return (
        <div className="space-y-7">
            {/* Hero */}
            <section className="fog-hero-card p-7 md:p-9">
                <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div className="space-y-3">
                        <div className="fog-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em]">
                            <Sparkles className="w-3 h-3" />
                            Raporlar
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                            {greeting}{firstName ? `, ${firstName}` : ''}
                        </h1>
                        <p className="text-sm text-zinc-400 max-w-xl">
                            Şirketinizin dijital performansı tek bakışta. Trafik, dönüşüm ve kampanya verileri FOG İstanbul standartlarıyla derlenir.
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500">
                        <span className="fog-accent-dot w-1.5 h-1.5 rounded-full fog-pulse" />
                        <span className="font-medium tracking-wider uppercase">Canlı Özet</span>
                    </div>
                </div>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockStats.map((stat) => (
                    <div key={stat.label} className="fog-premium-card p-5 group">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="h-10 w-10 rounded-xl flex items-center justify-center text-[#F5BEC8]"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(209,24,28,0.15), rgba(200,105,122,0.08))',
                                    border: '1px solid rgba(200,105,122,0.22)'
                                }}
                            >
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="flex items-center gap-0.5 text-[11px] text-[#F5BEC8] font-semibold">
                                <ArrowUpRight className="w-3 h-3" />
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                        <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Chart placeholder */}
            <div className="fog-premium-card p-6 md:p-7">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-9 w-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(209,24,28,0.18), rgba(200,105,122,0.10))', border: '1px solid rgba(200,105,122,0.22)' }}
                        >
                            <BarChart3 className="w-4 h-4 text-[#F5BEC8]" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white tracking-tight">Aylık Performans</h2>
                            <p className="text-[11px] text-zinc-500 mt-0.5">Son 30 günün özeti</p>
                        </div>
                    </div>
                </div>
                <div className="h-64 flex items-center justify-center rounded-xl"
                    style={{
                        background: 'radial-gradient(ellipse at 50% 50%, rgba(200,105,122,0.05), transparent 70%)',
                        border: '1px dashed rgba(200,105,122,0.18)'
                    }}
                >
                    <div className="text-center space-y-2">
                        <BarChart3 className="w-10 h-10 text-[#C8697A]/50 mx-auto" />
                        <p className="text-zinc-400 text-sm font-medium">Grafik verileri yakında</p>
                        <p className="text-zinc-600 text-xs">Google Analytics · Search Console · Instagram</p>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div
                className="rounded-2xl p-5 flex items-start gap-4 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(209,24,28,0.08), rgba(200,105,122,0.04))',
                    border: '1px solid rgba(200,105,122,0.18)'
                }}
            >
                <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #D1181C, #C8697A)', boxShadow: '0 8px 24px -8px rgba(209,24,28,0.5)' }}
                >
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Canlı entegrasyonlar yakında aktif</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Google Analytics, Google Ads, Instagram ve Search Console entegrasyonları tamamlandığında gerçek verileriniz bu panelde görüntülenecek.
                    </p>
                </div>
            </div>
        </div>
    );
}
