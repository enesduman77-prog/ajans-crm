import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    change?: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    delay?: number;
}

export default function StatCard({ label, value, change, icon: Icon, color, bgColor, delay = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.08 }}
            className="bg-[#111113] border border-white/[0.06] p-5 rounded-2xl hover:border-white/10 transition-colors"
        >
            <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl ${bgColor} flex items-center justify-center`}>
                    <Icon className={`w-[18px] h-[18px] ${color}`} />
                </div>
                {change && (
                    <span className={`text-xs font-medium ${change.startsWith('+') ? 'text-emerald-400' : change.startsWith('-') ? 'text-red-400' : 'text-zinc-400'}`}>
                        {change}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-zinc-500 text-[13px] mt-0.5">{label}</p>
        </motion.div>
    );
}
