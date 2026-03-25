import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Building2, ClipboardList, Users, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchApi, type SearchResult } from '../api/features';

const typeConfig: Record<string, { icon: typeof Building2; color: string; label: string }> = {
    COMPANY: { icon: Building2, color: 'text-orange-400', label: 'Şirket' },
    TASK: { icon: ClipboardList, color: 'text-emerald-400', label: 'Görev' },
    STAFF: { icon: Users, color: 'text-blue-400', label: 'Personel' },
    NOTE: { icon: FileText, color: 'text-purple-400', label: 'Not' },
};

export default function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ctrl+K / Cmd+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [open]);

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) { setResults([]); return; }
        setLoading(true);
        try {
            const data = await searchApi.search(q);
            const all: SearchResult[] = [
                ...data.companies,
                ...data.tasks,
                ...data.staff,
                ...data.notes,
            ];
            setResults(all);
            setSelectedIndex(0);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleChange = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(value), 300);
    };

    const goTo = (r: SearchResult) => {
        setOpen(false);
        navigate(r.route);
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            goTo(results[selectedIndex]);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-[560px] bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                    <Search className="w-5 h-5 text-zinc-500 shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => handleChange(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Şirket, görev, personel veya not ara..."
                        className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-600 outline-none"
                    />
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-zinc-600 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 font-mono">
                        ESC
                    </kbd>
                    <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300 sm:hidden">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[360px] overflow-y-auto">
                    {query.length < 2 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                            <Search className="w-8 h-8 mb-2 opacity-40" />
                            <p className="text-[13px]">Aramak için en az 2 karakter girin</p>
                            <p className="text-[11px] text-zinc-700 mt-1">
                                <kbd className="bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 font-mono text-[10px]">Ctrl</kbd>
                                {' + '}
                                <kbd className="bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 font-mono text-[10px]">K</kbd>
                                {' ile açıp kapatın'}
                            </p>
                        </div>
                    ) : results.length === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                            <p className="text-[13px]">Sonuç bulunamadı</p>
                        </div>
                    ) : (
                        results.map((r, i) => {
                            const cfg = typeConfig[r.type] || typeConfig.NOTE;
                            const Icon = cfg.icon;
                            return (
                                <button
                                    key={`${r.type}-${r.id}`}
                                    onClick={() => goTo(r)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === selectedIndex ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${cfg.color} shrink-0`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] text-white font-medium truncate">{r.title}</p>
                                        {r.subtitle && (
                                            <p className="text-[11px] text-zinc-500 truncate">{r.subtitle}</p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-zinc-600 bg-white/[0.04] rounded px-1.5 py-0.5">{cfg.label}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
