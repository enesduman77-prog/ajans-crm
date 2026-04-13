import { useQuery } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import type { StaffAnalyticsResponse } from '../../api/staff';
import {
    ListTodo, CheckCircle2, Clock, TrendingUp,
    Activity, Target, Flame, Timer, BarChart3, AlertTriangle
} from 'lucide-react';
import { StatCard, AreaChartCard, DonutChartCard, BarChartCard, ProgressListCard } from '../../components/analytics';

export default function StaffAnalyticsPage() {
    const { data, isLoading } = useQuery<StaffAnalyticsResponse>({
        queryKey: ['staff-analytics'],
        queryFn: () => staffApi.getMyAnalytics(),
    });

    if (isLoading || !data) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-6 w-6 border-2 border-emerald-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    const hoursThisMonth = Math.floor(data.totalMinutesThisMonth / 60);
    const minsThisMonth = data.totalMinutesThisMonth % 60;

    const stats = [
        { label: 'Aktif Görevler', value: data.activeTasks, icon: ListTodo, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { label: 'Bu Hafta Tamamlanan', value: data.completedThisWeek, icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
        { label: 'Bekleyen', value: data.pendingTasks, icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
        { label: 'Tamamlanma Oranı', value: `%${data.completionRate}`, icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-500/10' },
        { label: 'Bu Ay Çalışma', value: `${hoursThisMonth}s ${minsThisMonth}d`, icon: Timer, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
        { label: 'Geciken', value: data.overdueTasks, icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
    ];

    const priorityTotal = data.priorityDistribution.reduce((a, b) => a + b.value, 0);

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
                    <span className="text-xs text-zinc-400">Güncel Veriler</span>
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
                        data={data.weeklyFlow}
                        dataKey="tamamlanan"
                        secondaryDataKey="yeni"
                        color="#10b981"
                        secondaryColor="#3b82f6"
                        gradientId="staffWeekly"
                    />
                </div>
                {priorityTotal > 0 ? (
                    <DonutChartCard
                        title="Öncelik Dağılımı"
                        icon={Target}
                        data={data.priorityDistribution}
                        centerLabel="Toplam"
                        centerValue={priorityTotal}
                    />
                ) : (
                    <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center justify-center">
                        <Target className="w-8 h-8 text-zinc-700 mb-2" />
                        <p className="text-sm text-zinc-500">Aktif görev yok</p>
                    </div>
                )}
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarChartCard
                    title="Aylık Çalışma Saatleri"
                    icon={BarChart3}
                    iconColor="text-cyan-400"
                    data={data.monthlyHours}
                    dataKey="saat"
                    color="#06b6d4"
                />
                {data.companyTasks.length > 0 ? (
                    <ProgressListCard
                        title="Şirket Bazlı Görevler"
                        icon={Target}
                        iconColor="text-purple-400"
                        items={data.companyTasks}
                    />
                ) : (
                    <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center justify-center">
                        <Flame className="w-8 h-8 text-zinc-700 mb-2" />
                        <p className="text-sm text-zinc-500">Henüz şirket bazlı görev yok</p>
                    </div>
                )}
            </div>
        </div>
    );
}
