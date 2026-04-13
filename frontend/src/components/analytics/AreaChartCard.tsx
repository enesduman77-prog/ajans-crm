import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import type { LucideIcon } from 'lucide-react';

interface AreaChartCardProps {
    title: string;
    icon: LucideIcon;
    iconColor?: string;
    data: Array<Record<string, unknown>>;
    dataKey: string;
    xAxisKey?: string;
    color?: string;
    gradientId?: string;
    secondaryDataKey?: string;
    secondaryColor?: string;
    height?: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1e1e22] border border-white/[0.08] rounded-xl px-4 py-3 shadow-xl">
            <p className="text-xs text-zinc-400 mb-1.5">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                    {entry.name}: {entry.value?.toLocaleString('tr-TR')}
                </p>
            ))}
        </div>
    );
};

export default function AreaChartCard({
    title, icon: Icon, iconColor = 'text-blue-400',
    data, dataKey, xAxisKey = 'name',
    color = '#3b82f6', gradientId = 'areaGradient',
    secondaryDataKey, secondaryColor = '#f97316',
    height = 280
}: AreaChartCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6"
        >
            <div className="flex items-center gap-2 mb-6">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <h2 className="text-base font-semibold text-white">{title}</h2>
            </div>
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                        {secondaryDataKey && (
                            <linearGradient id={`${gradientId}_sec`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={secondaryColor} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={secondaryColor} stopOpacity={0} />
                            </linearGradient>
                        )}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        name={dataKey}
                    />
                    {secondaryDataKey && (
                        <Area
                            type="monotone"
                            dataKey={secondaryDataKey}
                            stroke={secondaryColor}
                            strokeWidth={2}
                            fill={`url(#${gradientId}_sec)`}
                            name={secondaryDataKey}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
