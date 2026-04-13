import { useEffect, useState } from 'react';
import { staffApi, type NoteResponse } from '../../api/staff';
import type { CompanyResponse } from '../../api/admin';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, Building2, Search, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function NotesPage() {
    const [notes, setNotes] = useState<NoteResponse[]>([]);
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [content, setContent] = useState('');
    const [noteCompanyId, setNoteCompanyId] = useState('');
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

    const loadNotes = () => {
        setLoading(true);
        Promise.all([
            staffApi.getNotes(0, 50, companyFilter || undefined),
            staffApi.getCompanies(),
        ]).then(([noteData, companyData]) => {
            setNotes(noteData.content);
            setCompanies(companyData);
        }).catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadNotes(); }, [companyFilter]);

    const createNote = async () => {
        if (!content.trim()) return;
        try {
            const newNote = await staffApi.createNote({
                content: content.trim(),
                companyId: noteCompanyId || undefined,
            });
            setNotes(prev => [newNote, ...prev]);
            setContent('');
            setNoteCompanyId('');
            setShowForm(false);
        } catch (err) {
            console.error('Note create error:', err);
        }
    };

    const deleteNote = async (id: string) => {
        try {
            await staffApi.deleteNote(id);
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Note delete error:', err);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedNotes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filtered = notes.filter(n => {
        if (!search) return true;
        const q = search.toLowerCase();
        return n.content.toLowerCase().includes(q) ||
            n.userName.toLowerCase().includes(q) ||
            (n.companyName || '').toLowerCase().includes(q);
    });

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-pink-400" />
                        Notlar
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Markdown destekli not defteri</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Not
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Notlarda ara..."
                        className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-pink-500/40 placeholder:text-zinc-700"
                    />
                </div>
                <select
                    value={companyFilter}
                    onChange={e => setCompanyFilter(e.target.value)}
                    className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-pink-500/40"
                >
                    <option value="">Tüm Şirketler</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* New Note Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-white">Yeni Not</h3>
                            <button onClick={() => setShowForm(false)} className="text-zinc-600 hover:text-zinc-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <select
                            value={noteCompanyId}
                            onChange={e => setNoteCompanyId(e.target.value)}
                            className="w-full px-3 py-2 bg-[#09090b] border border-white/[0.08] rounded-xl text-sm text-white outline-none"
                        >
                            <option value="">Genel Not</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Markdown formatında yazabilirsiniz..."
                            rows={6}
                            className="w-full px-3 py-2 bg-[#09090b] border border-white/[0.08] rounded-xl text-sm text-white outline-none resize-none font-mono placeholder:text-zinc-700"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={createNote}
                                disabled={!content.trim()}
                                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-30 text-white rounded-xl text-sm font-medium transition-colors"
                            >
                                Kaydet
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notes Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                    <FileText className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm">Not bulunamadı</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((note, idx) => {
                        const expanded = expandedNotes.has(note.id);
                        const isLong = note.content.length > 200;
                        return (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-white/[0.1] transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[11px] text-zinc-500">{note.userName}</span>
                                        {note.companyName && (
                                            <span className="flex items-center gap-1 text-[10px] text-orange-400/60 bg-orange-500/10 px-1.5 py-0.5 rounded">
                                                <Building2 className="w-2.5 h-2.5" />
                                                {note.companyName}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => deleteNote(note.id)} className="text-zinc-700 hover:text-red-400 transition-colors shrink-0">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className={`prose prose-invert prose-sm max-w-none text-zinc-300 ${!expanded && isLong ? 'max-h-[120px] overflow-hidden' : ''}`}>
                                    <ReactMarkdown>{expanded || !isLong ? note.content : note.content.slice(0, 200) + '...'}</ReactMarkdown>
                                </div>

                                {isLong && (
                                    <button
                                        onClick={() => toggleExpand(note.id)}
                                        className="flex items-center gap-1 mt-2 text-[11px] text-pink-400 hover:text-pink-300 transition-colors"
                                    >
                                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {expanded ? 'Daralt' : 'Devamını oku'}
                                    </button>
                                )}

                                <p className="text-[10px] text-zinc-700 mt-2">{formatDate(note.createdAt)}</p>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
