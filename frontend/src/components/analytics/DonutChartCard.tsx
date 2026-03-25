import { motion } from 'framer-motion';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { LucideIcon } from 'lucide-react';

interface DonutChartCardProps {
    title: string;
    icon: LucideIcon;
    iconColor?: string;
    data: Array<{ name: string; value: number; color: string }>;
    height?: number;
    innerRadius?: number;
    outerRadius?: number;
    centerLabel?: string;
    centerValue?: string | number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1e1e22] border border-white/[0.08] rounded-xl px-4 py-3 shadow-xl">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: payload[0].payload.color }} />
                {payload[0].name}: {payload[0].value?.toLocaleString('tr-TR')}
            </p>
        </div>
    );
};

const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
    if (!payload) return null;
    return (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                    <span className="text-xs text-zinc-400">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function DonutChartCard({
    title, icon: Icon, iconColor = 'text-purple-400',
    data, height = 280,
    innerRadius = 60, outerRadius = 90,
    centerLabel, centerValue
}: DonutChartCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6"
        >
            <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <h2 className="text-base font-semibold text-white">{title}</h2>
            </div>
            <div className="relative">
                <ResponsiveContainer width="100%" height={height}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="45%"
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<CustomLegend />} />
                    </PieChart>
                </ResponsiveContainer>
                {centerLabel && (
                    <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <p className="text-xl font-bold text-white">{centerValue}</p>
                        <p className="text-[11px] text-zinc-500">{centerLabel}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
