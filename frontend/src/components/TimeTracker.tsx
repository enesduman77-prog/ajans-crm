import { useState, useEffect, useRef } from 'react';
import { Square, Timer } from 'lucide-react';
import { timeTrackingApi, type TimeEntryResponse } from '../api/features';

export default function TimeTracker() {
    const [running, setRunning] = useState<TimeEntryResponse | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        timeTrackingApi.getRunning().then(entry => {
            setRunning(entry);
            if (entry) {
                const start = new Date(entry.startedAt).getTime();
                setElapsed(Math.floor((Date.now() - start) / 1000));
            }
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                const start = new Date(running.startedAt).getTime();
                setElapsed(Math.floor((Date.now() - start) / 1000));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [running]);

    const stopTimer = async () => {
        if (!running) return;
        try {
            await timeTrackingApi.stop();
            setRunning(null);
        } catch (err) {
            console.error('Timer stop error:', err);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!running) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-xl">
            <div className="relative flex items-center justify-center w-5 h-5">
                <Timer className="w-4 h-4 text-pink-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-pink-400/70 leading-tight truncate max-w-[120px]">
                    {running.taskTitle || 'Görev'}
                </span>
                <span className="text-[13px] font-mono font-bold text-pink-400 leading-tight">
                    {formatTime(elapsed)}
                </span>
            </div>
            <button
                onClick={stopTimer}
                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors ml-1"
                title="Durdur"
            >
                <Square className="w-3 h-3 fill-current" />
            </button>
        </div>
    );
}
