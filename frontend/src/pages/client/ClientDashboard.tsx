import { BarChart3, TrendingUp, Users, Eye, MousePointerClick } from 'lucide-react';

const mockStats = [
    { label: 'Toplam Ziyaretçi', value: '12,458', change: '+12.5%', icon: Users, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Sayfa Görüntüleme', value: '48,392', change: '+8.3%', icon: Eye, color: 'text-pink-400 bg-pink-500/10' },
    { label: 'Tıklama Oranı', value: '%3.2', change: '+0.4%', icon: MousePointerClick, color: 'text-amber-400 bg-amber-500/10' },
    { label: 'Dönüşüm', value: '342', change: '+15.2%', icon: TrendingUp, color: 'text-pink-400 bg-pink-500/10' },
];

export default function ClientDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Raporlar</h1>
                <p className="text-sm text-zinc-500 mt-1">Şirketinizin performans raporları</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockStats.map((stat) => (
                    <div key={stat.label} className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-pink-400 font-medium">{stat.change}</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Chart placeholder */}
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Aylık Performans</h2>
                </div>
                <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl">
                    <div className="text-center space-y-2">
                        <BarChart3 className="w-12 h-12 text-zinc-700 mx-auto" />
                        <p className="text-zinc-600 text-sm">Grafik verileri API entegrasyonundan sonra görüntülenecek</p>
                        <p className="text-zinc-700 text-xs">(Google Analytics, Search Console, Instagram API)</p>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-blue-300">Faz 6'da Aktif Olacak</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                        Google Analytics, Google Ads, Instagram ve Search Console API entegrasyonları tamamlandığında gerçek verilerinizi buradan takip edebileceksiniz.
                    </p>
                </div>
            </div>
        </div>
    );
}
