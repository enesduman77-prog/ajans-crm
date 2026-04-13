import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface MiniTrendProps {
    label: string;
    value: string | number;
    change?: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    sparkData?: number[];
}

function Sparkline({ data, color, height = 32, width = 80 }: { data: number[]; color: string; height?: number; width?: number }) {
    if (!data.length) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="flex-shrink-0">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function MiniTrend({ label, value, change, icon: Icon, color, bgColor, sparkData }: MiniTrendProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-4 hover:border-white/10 transition-colors"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-lg font-bold text-white leading-none">{value}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{label}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {sparkData && <Sparkline data={sparkData} color={color.includes('blue') ? '#3b82f6' : color.includes('pink') ? '#10b981' : color.includes('amber') ? '#f59e0b' : '#f97316'} />}
                    {change && (
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${change.startsWith('+') ? 'text-pink-400 bg-pink-500/10' : change.startsWith('-') ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 bg-zinc-500/10'}`}>
                            {change}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
