import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import type { LucideIcon } from 'lucide-react';

interface BarChartCardProps {
    title: string;
    icon: LucideIcon;
    iconColor?: string;
    data: Array<Record<string, unknown>>;
    dataKey: string;
    xAxisKey?: string;
    color?: string;
    height?: number;
    barColors?: string[];
    secondaryDataKey?: string;
    secondaryColor?: string;
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

export default function BarChartCard({
    title, icon: Icon, iconColor = 'text-amber-400',
    data, dataKey, xAxisKey = 'name',
    color = '#f97316', height = 280,
    barColors, secondaryDataKey, secondaryColor = '#3b82f6'
}: BarChartCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6"
        >
            <div className="flex items-center gap-2 mb-6">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <h2 className="text-base font-semibold text-white">{title}</h2>
            </div>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} name={dataKey}>
                        {barColors
                            ? data.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)
                            : data.map((_, i) => <Cell key={i} fill={color} fillOpacity={0.8} />)
                        }
                    </Bar>
                    {secondaryDataKey && (
                        <Bar dataKey={secondaryDataKey} radius={[6, 6, 0, 0]} fill={secondaryColor} fillOpacity={0.8} name={secondaryDataKey} />
                    )}
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
