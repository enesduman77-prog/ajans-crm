import {
    ListTodo, CheckCircle2, Clock, TrendingUp,
    Activity, Target, Flame, Timer, BarChart3
} from 'lucide-react';
import { StatCard, AreaChartCard, DonutChartCard, BarChartCard, ProgressListCard } from '../../components/analytics';

// Mock data - backend API entegrasyonunda gerçek verilerle değiştirilecek
const weeklyTasks = [
    { name: 'Pzt', tamamlanan: 5, yeni: 3 },
    { name: 'Sal', tamamlanan: 4, yeni: 6 },
    { name: 'Çar', tamamlanan: 7, yeni: 4 },
    { name: 'Per', tamamlanan: 3, yeni: 5 },
    { name: 'Cum', tamamlanan: 8, yeni: 2 },
    { name: 'Cmt', tamamlanan: 2, yeni: 1 },
    { name: 'Paz', tamamlanan: 1, yeni: 0 },
];

const tasksByPriority = [
    { name: 'Kritik', value: 4, color: '#ef4444' },
    { name: 'Yüksek', value: 8, color: '#f97316' },
    { name: 'Normal', value: 15, color: '#3b82f6' },
    { name: 'Düşük', value: 6, color: '#6b7280' },
];

const monthlyHours = [
    { name: 'Oca', saat: 142 },
    { name: 'Şub', saat: 156 },
    { name: 'Mar', saat: 168 },
    { name: 'Nis', saat: 148 },
    { name: 'May', saat: 175 },
    { name: 'Haz', saat: 162 },
];

const companyTasks = [
    { label: 'ABC Tech', value: 12, max: 15, color: '#3b82f6' },
    { label: 'XYZ Media', value: 8, max: 12, color: '#f97316' },
    { label: 'Delta Corp', value: 5, max: 6, color: '#10b981' },
    { label: 'Mega Dijital', value: 9, max: 14, color: '#8b5cf6' },
];

export default function StaffAnalyticsPage() {
    const stats = [
        { label: 'Aktif Görevler', value: 18, change: '+3', icon: ListTodo, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { label: 'Bu Hafta Tamamlanan', value: 12, change: '+4', icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
        { label: 'Bekleyen', value: 5, icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
        { label: 'Tamamlanma Oranı', value: '%87', change: '+2%', icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-500/10' },
        { label: 'Ortalama Süre', value: '1.8g', change: '-0.5g', icon: Timer, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
        { label: 'Verimlilik Puanı', value: '92', change: '+7', icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Performansım</h1>
                    <p className="text-zinc-500 text-[13px] mt-1">Kişisel iş analitiği ve performans metrikleri</p>
                </div>
                <div className="flex items-center gap-2 bg-[#111113] border border-white/[0.06] rounded-xl px-3 py-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-zinc-400">Bu Ay</span>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {stats.map((stat, i) => (
                    <StatCard key={stat.label} {...stat} delay={i} />
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <AreaChartCard
                        title="Haftalık Görev Akışı"
                        icon={TrendingUp}
                        data={weeklyTasks}
                        dataKey="tamamlanan"
                        secondaryDataKey="yeni"
                        color="#10b981"
                        secondaryColor="#3b82f6"
                        gradientId="staffWeekly"
                    />
                </div>
                <DonutChartCard
                    title="Öncelik Dağılımı"
                    icon={Target}
                    data={tasksByPriority}
                    centerLabel="Toplam"
                    centerValue={tasksByPriority.reduce((a, b) => a + b.value, 0)}
                />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarChartCard
                    title="Aylık Çalışma Saatleri"
                    icon={BarChart3}
                    iconColor="text-cyan-400"
                    data={monthlyHours}
                    dataKey="saat"
                    color="#06b6d4"
                />
                <ProgressListCard
                    title="Şirket Bazlı Görevler"
                    icon={Target}
                    iconColor="text-purple-400"
                    items={companyTasks}
                />
            </div>
        </div>
    );
}
