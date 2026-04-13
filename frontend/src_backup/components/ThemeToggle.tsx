import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../store/ThemeContext';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const options = [
        { value: 'light' as const, icon: Sun, label: 'Açık' },
        { value: 'dark' as const, icon: Moon, label: 'Koyu' },
        { value: 'system' as const, icon: Monitor, label: 'Sistem' },
    ];

    return (
        <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
            {options.map(opt => {
                const Icon = opt.icon;
                const active = theme === opt.value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className={`p-1.5 rounded-md transition-colors ${active
                                ? 'bg-white/[0.1] text-white'
                                : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                        title={opt.label}
                    >
                        <Icon className="w-3.5 h-3.5" />
                    </button>
                );
            })}
        </div>
    );
}
