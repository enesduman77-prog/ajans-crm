import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface ProgressItem {
    label: string;
    value: number;
    max: number;
    color: string;
}

interface ProgressListCardProps {
    title: string;
    icon: LucideIcon;
    iconColor?: string;
    items: ProgressItem[];
}

export default function ProgressListCard({ title, icon: Icon, iconColor = 'text-emerald-400', items }: ProgressListCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
        >
            <div className="flex items-center gap-2 mb-5">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <h2 className="text-base font-semibold text-white">{title}</h2>
            </div>
            <div className="space-y-4">
                {items.map((item, i) => {
                    const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0;
                    return (
                        <div key={i}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[13px] text-zinc-300">{item.label}</span>
                                <span className="text-[13px] text-zinc-500">{item.value}/{item.max} <span className="text-zinc-600">(%{pct})</span></span>
                            </div>
                            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ background: item.color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
