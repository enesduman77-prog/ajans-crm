import { useState, useEffect, useCallback } from 'react';
import { staffApi } from '../api/staff';
import type { TaskResponse, TaskNoteResponse } from '../api/staff';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, Clock, Building2, Trash2, MessageSquare, Send, ChevronRight, Tag, Flag, CheckCircle2 } from 'lucide-react';

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
    TODO: { bg: 'bg-zinc-800', text: 'text-zinc-400', label: 'Bekliyor' },
    IN_PROGRESS: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'Devam Ediyor' },
    DONE: { bg: 'bg-pink-900/30', text: 'text-pink-400', label: 'Tamamlandı' },
    OVERDUE: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Gecikmiş' },
};


const categoryLabels: Record<string, string> = {
    REELS: 'Reels', BLOG: 'Blog', PAYLASIM: 'Paylaşım', SEO: 'SEO',
    TASARIM: 'Tasarım', TOPLANTI: 'Toplantı', OTHER: 'Diğer',
};

function getRemainingTime(task: TaskResponse): { text: string; color: string } | null {
    if (task.status === 'DONE') return { text: 'Tamamlandı', color: 'text-pink-400' };
    const endDate = task.endDate;
    if (!endDate) return null;
    let end: Date;
    if (task.endTime) {
        const datePart = endDate.slice(0, 10);
        const timePart = task.endTime.length <= 5 ? task.endTime + ':00' : task.endTime;
        end = new Date(datePart + 'T' + timePart);
    } else {
        end = new Date(endDate);
    }
    if (isNaN(end.getTime())) return null;
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return { text: 'Süre doldu', color: 'text-red-400' };
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffDay >= 1) return { text: `${diffDay} gün kaldı`, color: diffDay <= 2 ? 'text-amber-400' : 'text-zinc-400' };
    if (diffHour >= 1) return { text: `${diffHour} saat kaldı`, color: 'text-amber-400' };
    return { text: `${diffMin} dakika kaldı`, color: 'text-red-400' };
}

interface TaskDetailPanelProps {
    task: TaskResponse | null;
    onClose: () => void;
    onStatusChange?: (taskId: string, status: string) => void;
}

export default function TaskDetailPanel({ task, onClose, onStatusChange }: TaskDetailPanelProps) {
    const [notes, setNotes] = useState<TaskNoteResponse[]>([]);
    const [noteText, setNoteText] = useState('');
    const [noteLoading, setNoteLoading] = useState(false);
    const [completing, setCompleting] = useState(false);

    const loadNotes = useCallback(async (taskId: string) => {
        try {
            const data = await staffApi.getTaskNotes(taskId);
            setNotes(data);
        } catch { }
    }, []);

    useEffect(() => {
        if (task) {
            setNotes([]);
            setNoteText('');
            loadNotes(task.id);
        }
    }, [task, loadNotes]);

    const handleAddNote = async () => {
        if (!noteText.trim() || !task) return;
        setNoteLoading(true);
        try {
            const note = await staffApi.addTaskNote(task.id, noteText.trim());
            setNotes(prev => [note, ...prev]);
            setNoteText('');
        } catch { }
        setNoteLoading(false);
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await staffApi.deleteTaskNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch { }
    };

    const handleComplete = async () => {
        if (!task || !onStatusChange) return;
        setCompleting(true);
        try {
            await onStatusChange(task.id, 'DONE');
        } catch { }
        setCompleting(false);
    };

    return (
        <AnimatePresence>
            {task && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
                    onClick={onClose}>
                    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="w-full max-w-lg bg-[#0c0c0e] border-l border-white/[0.06] h-full overflow-y-auto"
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm border-b border-white/[0.06] p-5 z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${(statusBadge[task.status] || statusBadge.TODO).bg} ${(statusBadge[task.status] || statusBadge.TODO).text}`}>
                                        {(statusBadge[task.status] || statusBadge.TODO).label}
                                    </span>
                                </div>
                                <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <h2 className="text-lg font-bold text-white mt-3">{task.title}</h2>
                            {/* Tamamlandı Button */}
                            {task.status !== 'DONE' && onStatusChange && (
                                <button
                                    onClick={handleComplete}
                                    disabled={completing}
                                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {completing ? 'Tamamlanıyor...' : 'Tamamlandı'}
                                </button>
                            )}
                        </div>

                        {/* Details */}
                        <div className="p-5 space-y-5">
                            {task.description && (
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Açıklama</p>
                                    <p className="text-sm text-zinc-300 leading-relaxed">{task.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0C0C0E] rounded-xl p-3 border border-white/[0.04]">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Atanan</p>
                                    <p className="text-sm text-white font-medium">{task.assignedToName}</p>
                                </div>
                                <div className="bg-[#0C0C0E] rounded-xl p-3 border border-white/[0.04]">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Building2 className="w-3 h-3" /> Şirket</p>
                                    <p className="text-sm text-white font-medium">{task.companyName || 'Ajans İçi'}</p>
                                </div>
                                <div className="bg-[#0C0C0E] rounded-xl p-3 border border-white/[0.04]">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3" /> Kategori</p>
                                    <p className="text-sm text-white font-medium">{categoryLabels[task.category] || task.category}</p>
                                </div>
                                <div className="bg-[#0C0C0E] rounded-xl p-3 border border-white/[0.04]">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Flag className="w-3 h-3" /> Oluşturan</p>
                                    <p className="text-sm text-white font-medium">{task.createdByName}</p>
                                </div>
                            </div>

                            {(task.startDate || task.endDate) && (
                                <div className="bg-[#0C0C0E] rounded-xl p-3 border border-white/[0.04]">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> Tarih & Saat</p>
                                    <div className="flex items-center gap-3">
                                        {task.startDate && (
                                            <div>
                                                <p className="text-[10px] text-zinc-600">Başlangıç</p>
                                                <p className="text-sm text-white font-medium">
                                                    {new Date(task.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    {task.startTime && <span className="text-zinc-400 ml-1">{task.startTime.slice(0, 5)}</span>}
                                                </p>
                                            </div>
                                        )}
                                        {task.startDate && task.endDate && (
                                            <ChevronRight className="w-4 h-4 text-zinc-600" />
                                        )}
                                        {task.endDate && (
                                            <div>
                                                <p className="text-[10px] text-zinc-600">Bitiş</p>
                                                <p className="text-sm text-white font-medium">
                                                    {new Date(task.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    {task.endTime && <span className="text-zinc-400 ml-1">{task.endTime.slice(0, 5)}</span>}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Remaining Time */}
                            {(() => {
                                const rem = getRemainingTime(task);
                                if (!rem) return null;
                                return (
                                    <div className={`rounded-xl p-3 border ${rem.color === 'text-red-400' ? 'bg-red-500/5 border-red-500/20' : rem.color === 'text-amber-400' ? 'bg-amber-500/5 border-amber-500/20' : rem.color === 'text-pink-400' ? 'bg-pink-500/5 border-pink-500/20' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Kalan Süre</p>
                                        <p className={`text-sm font-bold ${rem.color}`}>⏱ {rem.text}</p>
                                    </div>
                                );
                            })()}

                            {task.createdAt && (
                                <p className="text-[10px] text-zinc-700">
                                    Oluşturulma: {new Date(task.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}

                            {/* Notes Section */}
                            <div className="border-t border-white/[0.06] pt-5">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                                    <MessageSquare className="w-4 h-4 text-pink-400" /> Notlar
                                    {notes.length > 0 && <span className="text-[10px] text-zinc-600 bg-white/[0.04] rounded-full px-2 py-0.5">{notes.length}</span>}
                                </h3>

                                {/* Add note */}
                                <div className="flex gap-2 mb-4">
                                    <input
                                        value={noteText}
                                        onChange={e => setNoteText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                                        placeholder="Not ekle..."
                                        className="flex-1 px-3 py-2 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-pink-500/50 transition-colors"
                                    />
                                    <button onClick={handleAddNote} disabled={noteLoading || !noteText.trim()}
                                        className="px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl transition-colors disabled:opacity-30">
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Notes list */}
                                <div className="space-y-2">
                                    {notes.map(note => (
                                        <div key={note.id} className="bg-[#0C0C0E] border border-white/[0.04] rounded-xl p-3 group/note">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[11px] font-semibold text-pink-400">{note.authorName}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-zinc-700">
                                                        {new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <button onClick={() => handleDeleteNote(note.id)}
                                                        className="p-0.5 rounded text-zinc-800 hover:text-red-400 opacity-0 group-hover/note:opacity-100 transition-all">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-zinc-300">{note.content}</p>
                                        </div>
                                    ))}
                                    {notes.length === 0 && (
                                        <p className="text-center text-zinc-700 text-xs py-4">Henüz not eklenmemiş</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
