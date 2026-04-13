import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import type { DashboardStats } from '../../api/admin';
import { motion } from 'framer-motion';
import { Building2, Users, ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getStats()
            .then(setStats)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    const cards = [
        { label: 'Toplam Şirket', value: stats?.totalCompanies ?? 0, icon: Building2, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { label: 'Aktif Çalışan', value: stats?.totalStaff ?? 0, icon: Users, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
        { label: 'Toplam Görev', value: stats?.totalTasks ?? 0, icon: ListTodo, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
        { label: 'Tamamlanan', value: stats?.doneTasks ?? 0, icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-500/10' },
        { label: 'Devam Eden', value: stats?.inProgressTasks ?? 0, icon: Clock, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
        { label: 'Bekleyen', value: stats?.todoTasks ?? 0, icon: AlertCircle, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Kontrol Paneli</h1>
                <p className="text-zinc-500 text-[13px] mt-1">FOG İstanbul CRM genel bakış</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-[#0C0C0E] border border-white/[0.06] p-5 rounded-2xl hover:border-white/10 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`h-9 w-9 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                                <card.icon className={`w-[18px] h-[18px] ${card.color}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                        <p className="text-zinc-500 text-[13px] mt-0.5">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0C0C0E] border border-white/[0.06] p-5 rounded-2xl">
                <h2 className="text-base font-semibold text-white mb-3">Hızlı İşlemler</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <a href="/admin/companies?action=create" className="p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/[0.06] text-[13px] text-zinc-400 hover:text-white transition-all flex items-center gap-3">
                        <Building2 className="w-[18px] h-[18px] text-orange-400" />
                        <span>Yeni Şirket Ekle</span>
                    </a>
                    <a href="/admin/staff?action=create" className="p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/[0.06] text-[13px] text-zinc-400 hover:text-white transition-all flex items-center gap-3">
                        <Users className="w-[18px] h-[18px] text-pink-400" />
                        <span>Yeni Çalışan Ekle</span>
                    </a>
                    <a href="/admin/companies" className="p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/[0.06] text-[13px] text-zinc-400 hover:text-white transition-all flex items-center gap-3">
                        <ListTodo className="w-[18px] h-[18px] text-amber-400" />
                        <span>Tüm Şirketleri Gör</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
