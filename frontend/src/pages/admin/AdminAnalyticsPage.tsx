import {
    Building2, Users, ListTodo, CheckCircle2, Clock, TrendingUp,
    Activity, BarChart3, Target, Zap
} from 'lucide-react';
import { StatCard, AreaChartCard, BarChartCard, DonutChartCard, ProgressListCard } from '../../components/analytics';

// Mock data - backend API entegrasyonunda gerçek verilerle değiştirilecek
const monthlyData = [
    { name: 'Oca', görevler: 45, tamamlanan: 38 },
    { name: 'Şub', görevler: 52, tamamlanan: 44 },
    { name: 'Mar', görevler: 61, tamamlanan: 55 },
    { name: 'Nis', görevler: 48, tamamlanan: 42 },
    { name: 'May', görevler: 73, tamamlanan: 65 },
    { name: 'Haz', görevler: 68, tamamlanan: 58 },
    { name: 'Tem', görevler: 82, tamamlanan: 74 },
    { name: 'Ağu', görevler: 56, tamamlanan: 48 },
    { name: 'Eyl', görevler: 91, tamamlanan: 83 },
    { name: 'Eki', görevler: 78, tamamlanan: 70 },
    { name: 'Kas', görevler: 85, tamamlanan: 76 },
    { name: 'Ara', görevler: 64, tamamlanan: 55 },
];

const companyPerformance = [
    { name: 'ABC Tech', görevler: 28, tamamlanan: 24 },
    { name: 'XYZ Media', görevler: 35, tamamlanan: 22 },
    { name: 'Delta Corp', görevler: 19, tamamlanan: 17 },
    { name: 'Mega Dijital', görevler: 42, tamamlanan: 38 },
    { name: 'Star İletişim', görevler: 31, tamamlanan: 25 },
];

const taskDistribution = [
    { name: 'Sosyal Medya', value: 35, color: '#3b82f6' },
    { name: 'Web Geliştirme', value: 25, color: '#f97316' },
    { name: 'Grafik Tasarım', value: 20, color: '#10b981' },
    { name: 'SEO / SEM', value: 12, color: '#8b5cf6' },
    { name: 'PR & İletişim', value: 8, color: '#ec4899' },
];

const staffPerformance = [
    { label: 'Ahmet Yılmaz', value: 42, max: 48, color: '#3b82f6' },
    { label: 'Elif Kaya', value: 38, max: 45, color: '#10b981' },
    { label: 'Mehmet Demir', value: 35, max: 40, color: '#f97316' },
    { label: 'Zeynep Çelik', value: 28, max: 35, color: '#8b5cf6' },
    { label: 'Can Aksoy', value: 22, max: 30, color: '#ec4899' },
];

export default function AdminAnalyticsPage() {
    const stats = [
        { label: 'Toplam Şirket', value: 12, change: '+2', icon: Building2, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { label: 'Aktif Çalışan', value: 8, change: '+1', icon: Users, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
        { label: 'Aylık Görev', value: 85, change: '+12%', icon: ListTodo, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
        { label: 'Tamamlanma Oranı', value: '%89', change: '+3%', icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-500/10' },
        { label: 'Ortalama Süre', value: '2.4g', change: '-0.3g', icon: Clock, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
        { label: 'Verimlilik', value: '%94', change: '+5%', icon: Zap, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Analitik</h1>
                    <p className="text-zinc-500 text-[13px] mt-1">Ajans performansı ve iş analitiği</p>
                </div>
                <div className="flex items-center gap-2 bg-[#0C0C0E] border border-white/[0.06] rounded-xl px-3 py-2">
                    <Activity className="w-4 h-4 text-pink-400" />
                    <span className="text-xs text-zinc-400">Son 30 Gün</span>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {stats.map((stat, i) => (
                    <StatCard key={stat.label} {...stat} delay={i} />
                ))}
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <AreaChartCard
                        title="Aylık Görev Trendleri"
                        icon={TrendingUp}
                        data={monthlyData}
                        dataKey="görevler"
                        secondaryDataKey="tamamlanan"
                        color="#3b82f6"
                        secondaryColor="#10b981"
                        gradientId="adminArea"
                    />
                </div>
                <DonutChartCard
                    title="Görev Dağılımı"
                    icon={Target}
                    data={taskDistribution}
                    centerLabel="Toplam"
                    centerValue={taskDistribution.reduce((a, b) => a + b.value, 0)}
                />
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarChartCard
                    title="Şirket Performansı"
                    icon={BarChart3}
                    data={companyPerformance}
                    dataKey="tamamlanan"
                    secondaryDataKey="görevler"
                    color="#10b981"
                    secondaryColor="rgba(59,130,246,0.3)"
                />
                <ProgressListCard
                    title="Çalışan Performansı"
                    icon={Users}
                    items={staffPerformance}
                />
            </div>
        </div>
    );
}
