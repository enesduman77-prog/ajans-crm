import { Fragment } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface HeatmapItem {
    day: string;
    hour: string;
    value: number;
}

interface HeatmapCardProps {
    title: string;
    icon: LucideIcon;
    iconColor?: string;
    data: HeatmapItem[];
    color?: string;
}

export default function HeatmapCard({ title, icon: Icon, iconColor = 'text-pink-400', data, color = '#f97316' }: HeatmapCardProps) {
    const days = [...new Set(data.map(d => d.day))];
    const hours = [...new Set(data.map(d => d.hour))];
    const maxVal = Math.max(...data.map(d => d.value), 1);

    const getValue = (day: string, hour: string) => {
        const item = data.find(d => d.day === day && d.hour === hour);
        return item?.value ?? 0;
    };

    const getOpacity = (value: number) => {
        if (value === 0) return 0.03;
        return 0.15 + (value / maxVal) * 0.85;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6"
        >
            <div className="flex items-center gap-2 mb-5">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <h2 className="text-base font-semibold text-white">{title}</h2>
            </div>
            <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(${hours.length}, 1fr)` }}>
                        {/* Hour headers */}
                        <div />
                        {hours.map(h => (
                            <div key={h} className="text-[10px] text-zinc-600 text-center">{h}</div>
                        ))}

                        {/* Data rows */}
                        {days.map(day => (
                            <Fragment key={day}>
                                <div className="text-[11px] text-zinc-500 flex items-center">{day}</div>
                                {hours.map(hour => {
                                    const val = getValue(day, hour);
                                    return (
                                        <div
                                            key={`${day}-${hour}`}
                                            className="h-7 rounded-md transition-colors cursor-default"
                                            style={{ background: color, opacity: getOpacity(val) }}
                                            title={`${day} ${hour}: ${val}`}
                                        />
                                    );
                                })}
                            </Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
