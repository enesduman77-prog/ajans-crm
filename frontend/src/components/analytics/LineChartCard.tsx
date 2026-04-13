import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import type { LucideIcon } from 'lucide-react';

interface LineChartCardProps {
    title: string;
    icon: LucideIcon;
    iconColor?: string;
    data: Array<Record<string, unknown>>;
    lines: Array<{ dataKey: string; color: string; name?: string }>;
    xAxisKey?: string;
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

export default function LineChartCard({
    title, icon: Icon, iconColor = 'text-cyan-400',
    data, lines, xAxisKey = 'name', height = 280
}: LineChartCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6"
        >
            <div className="flex items-center gap-2 mb-6">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <h2 className="text-base font-semibold text-white">{title}</h2>
            </div>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            type="monotone"
                            dataKey={line.dataKey}
                            stroke={line.color}
                            strokeWidth={2}
                            dot={{ r: 3, fill: line.color, stroke: '#0C0C0E', strokeWidth: 2 }}
                            activeDot={{ r: 5, fill: line.color, stroke: '#0C0C0E', strokeWidth: 2 }}
                            name={line.name || line.dataKey}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
