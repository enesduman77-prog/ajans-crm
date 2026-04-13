import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import type { MeetingResponse } from '../../api/staff';
import { useAuth } from '../../store/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, Clock, MapPin, Users, CheckCircle2, Trash2, FileText,
    Calendar, Building2, AlertCircle, ChevronDown, ChevronUp, MessageSquare,
} from 'lucide-react';

const inputCls = "w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-cyan-500/50 transition-colors";
const labelCls = "text-[10px] font-bold text-zinc-500 uppercase tracking-widest";

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    PLANNED: { label: 'Planlandı', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    COMPLETED: { label: 'Tamamlandı', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
    CANCELLED: { label: 'İptal', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function MeetingsPage() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [selected, setSelected] = useState<MeetingResponse | null>(null);
    const [noteModal, setNoteModal] = useState<{ meetingId: string; mode: 'complete' | 'add' } | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'PLANNED' | 'COMPLETED'>('ALL');

    // Form state
    const [form, setForm] = useState({
        companyId: '', title: '', description: '', meetingDate: '',
        durationMinutes: 60, location: '', participantIds: [] as string[],
    });

    const { data: meetingsData, isLoading } = useQuery({
        queryKey: ['meetings'],
        queryFn: () => staffApi.getMeetings(0, 100),
    });

    const { data: companies = [] } = useQuery({
        queryKey: ['companies'],
        queryFn: () => staffApi.getCompanies(),
    });

    const { data: users = [] } = useQuery({
        queryKey: ['assignable-users', form.companyId],
        queryFn: () => staffApi.getAssignableUsers(form.companyId || undefined),
    });

    const createMut = useMutation({
        mutationFn: () => staffApi.createMeeting({
            companyId: form.companyId || undefined,
            title: form.title,
            description: form.description || undefined,
            meetingDate: form.meetingDate ? new Date(form.meetingDate).toISOString() : '',
            durationMinutes: form.durationMinutes || undefined,
            location: form.location || undefined,
            participantIds: form.participantIds.length ? form.participantIds : undefined,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['meetings'] });
            setShowCreate(false);
            setForm({ companyId: '', title: '', description: '', meetingDate: '', durationMinutes: 60, location: '', participantIds: [] });
        },
    });

    const completeMut = useMutation({
        mutationFn: ({ id, content }: { id: string; content: string }) =>
            staffApi.completeMeeting(id, content),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['meetings'] });
            setNoteModal(null);
            setNoteContent('');
            setSelected(null);
        },
    });

    const addNoteMut = useMutation({
        mutationFn: ({ id, content }: { id: string; content: string }) =>
            staffApi.addMeetingNote(id, content),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['meetings'] });
            setNoteModal(null);
            setNoteContent('');
        },
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => staffApi.deleteMeeting(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['meetings'] });
            setSelected(null);
        },
    });

    const meetings = (meetingsData?.content ?? []).filter(m =>
        filter === 'ALL' ? true : m.status === filter
    );

    const formatDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const isParticipant = (m: MeetingResponse) =>
        m.participants.some(p => p.userId === user?.id) || m.createdById === user?.id;

    const hasSubmittedNote = (m: MeetingResponse) =>
        m.notes?.some(n => n.userId === user?.id) ?? false;

    const needsMyNote = (m: MeetingResponse) =>
        m.status === 'COMPLETED' && isParticipant(m) && !hasSubmittedNote(m);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Toplantılar</h1>
                    <p className="text-sm text-zinc-500 mt-1">{meetings.length} toplantı</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all">
                    <Plus className="w-4 h-4" /> Yeni Toplantı
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['PLANNED', 'COMPLETED', 'ALL'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]'}`}>
                        {f === 'ALL' ? 'Tümü' : statusMap[f].label}
                    </button>
                ))}
            </div>

            {/* Needs My Note Alert */}
            {meetings.some(needsMyNote) && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-amber-300">Notunuz Bekleniyor</p>
                        <p className="text-xs text-amber-400/70 mt-1">
                            Tamamlanan {meetings.filter(needsMyNote).length} toplantı için notlarınızı yazmanız bekleniyor.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Meeting List */}
            {isLoading ? (
                <div className="text-center py-20 text-zinc-500">Yükleniyor...</div>
            ) : meetings.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">Toplantı bulunamadı</div>
            ) : (
                <div className="space-y-3">
                    {meetings.map(m => {
                        const st = statusMap[m.status] || statusMap.PLANNED;
                        const myNoteNeeded = needsMyNote(m);
                        return (
                            <motion.div key={m.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={`bg-[#0C0C0E] border rounded-2xl overflow-hidden transition-all hover:border-white/[0.12] cursor-pointer
                                    ${myNoteNeeded ? 'border-amber-500/30' : 'border-white/[0.06]'}`}
                                onClick={() => setSelected(selected?.id === m.id ? null : m)}
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-base font-bold text-white truncate">{m.title}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${st.bg} ${st.color}`}>
                                                    {st.label}
                                                </span>
                                                {myNoteNeeded && (
                                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border border-amber-500/20 bg-amber-500/10 text-amber-400 animate-pulse">
                                                        Not Yazın
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(m.meetingDate)}
                                                </span>
                                                {m.durationMinutes && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {m.durationMinutes} dk
                                                    </span>
                                                )}
                                                {m.location && (
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {m.location}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    {m.companyName || 'Ajans İçi'}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {m.participants.length} katılımcı
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {selected?.id === m.id ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                <AnimatePresence>
                                    {selected?.id === m.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
                                                {m.description && (
                                                    <p className="text-sm text-zinc-400">{m.description}</p>
                                                )}

                                                {/* Participants */}
                                                <div>
                                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Katılımcılar</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {m.participants.map(p => (
                                                            <div key={p.userId}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2
                                                                    ${m.status === 'COMPLETED'
                                                                        ? p.noteSubmitted
                                                                            ? 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                                        : 'bg-white/[0.04] border-white/[0.06] text-zinc-300'}`}>
                                                                {p.fullName}
                                                                {m.status === 'COMPLETED' && (
                                                                    p.noteSubmitted
                                                                        ? <CheckCircle2 className="w-3 h-3" />
                                                                        : <AlertCircle className="w-3 h-3" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {m.status === 'COMPLETED' && (
                                                        <p className="text-[10px] text-zinc-600 mt-1.5">
                                                            <CheckCircle2 className="w-3 h-3 inline text-pink-500" /> Not yazıldı &nbsp;
                                                            <AlertCircle className="w-3 h-3 inline text-amber-500" /> Not bekleniyor
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Notes */}
                                                {m.notes && m.notes.length > 0 && (
                                                    <div>
                                                        <button onClick={(e) => { e.stopPropagation(); setExpandedNotes(expandedNotes === m.id ? null : m.id); }}
                                                            className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">
                                                            <FileText className="w-3.5 h-3.5" />
                                                            Toplantı Notları ({m.notes.length})
                                                            {expandedNotes === m.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        </button>
                                                        <AnimatePresence>
                                                            {expandedNotes === m.id && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="mt-2 space-y-2">
                                                                        {m.notes.map((n, i) => (
                                                                            <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                                                                                <div className="flex items-center justify-between mb-1">
                                                                                    <span className="text-xs font-bold text-cyan-400">{n.fullName}</span>
                                                                                    <span className="text-[10px] text-zinc-600">
                                                                                        {new Date(n.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{n.content}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 pt-2">
                                                    {m.status === 'PLANNED' && (m.createdById === user?.id || user?.globalRole === 'ADMIN') && (
                                                        <button onClick={(e) => { e.stopPropagation(); setNoteModal({ meetingId: m.id, mode: 'complete' }); }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition-all">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Tamamla
                                                        </button>
                                                    )}
                                                    {m.status === 'COMPLETED' && isParticipant(m) && !hasSubmittedNote(m) && (
                                                        <button onClick={(e) => { e.stopPropagation(); setNoteModal({ meetingId: m.id, mode: 'add' }); }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all animate-pulse">
                                                            <MessageSquare className="w-3.5 h-3.5" /> Notumu Yaz
                                                        </button>
                                                    )}
                                                    {m.status === 'PLANNED' && (m.createdById === user?.id || user?.globalRole === 'ADMIN') && (
                                                        <button onClick={(e) => { e.stopPropagation(); if (confirm('Toplantıyı silmek istediğinize emin misiniz?')) deleteMut.mutate(m.id); }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-500/20">
                                                            <Trash2 className="w-3.5 h-3.5" /> Sil
                                                        </button>
                                                    )}
                                                </div>

                                                <p className="text-[10px] text-zinc-600">
                                                    Oluşturan: {m.createdByName} · {new Date(m.createdAt).toLocaleDateString('tr-TR')}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Meeting Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCreate(false)}>
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0C0C0E] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                                <h3 className="text-lg font-bold text-white">Yeni Toplantı</h3>
                                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="p-5 space-y-4">
                                <div>
                                    <label className={labelCls}>Şirket</label>
                                    <select value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value }))} className={inputCls}>
                                        <option value="">Ajans İçi (Şirketsiz)</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Toplantı Konusu *</label>
                                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Toplantı konusu..." required />
                                </div>
                                <div>
                                    <label className={labelCls}>Açıklama</label>
                                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={`${inputCls} resize-none`} rows={2} placeholder="Toplantı detayları..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Tarih & Saat *</label>
                                        <input type="datetime-local" value={form.meetingDate} onChange={e => setForm(p => ({ ...p, meetingDate: e.target.value }))} className={inputCls} required />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Süre (dk)</label>
                                        <input type="number" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))} className={inputCls} min={15} step={15} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Konum</label>
                                    <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className={inputCls} placeholder="Ofis, Zoom, vb..." />
                                </div>
                                <div>
                                    <label className={labelCls}>Katılımcılar</label>
                                    <select multiple value={form.participantIds} onChange={e => setForm(p => ({ ...p, participantIds: Array.from(e.target.selectedOptions, o => o.value) }))}
                                        className={`${inputCls} min-h-[100px]`}>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                                    </select>
                                    <p className="text-[10px] text-zinc-600 mt-1">Ctrl/Cmd ile çoklu seçim yapabilirsiniz</p>
                                </div>
                                <button type="submit" disabled={createMut.isPending}
                                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                                    {createMut.isPending ? 'Oluşturuluyor...' : 'Toplantı Oluştur'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Note Submission Modal */}
            <AnimatePresence>
                {noteModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => { setNoteModal(null); setNoteContent(''); }}>
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0C0C0E] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                                <h3 className="text-lg font-bold text-white">
                                    {noteModal.mode === 'complete' ? 'Toplantıyı Tamamla' : 'Toplantı Notu Yaz'}
                                </h3>
                                <button onClick={() => { setNoteModal(null); setNoteContent(''); }} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
                                    <p className="text-xs text-cyan-300">
                                        {noteModal.mode === 'complete'
                                            ? 'Toplantıyı tamamlamadan önce toplantı hakkındaki notlarınızı yazınız. Diğer katılımcılardan da notlarını yazmaları istenecektir.'
                                            : 'Bu toplantı hakkındaki notlarınızı yazınız.'}
                                    </p>
                                </div>
                                <div>
                                    <label className={labelCls}>Toplantı Notlarınız *</label>
                                    <textarea
                                        value={noteContent}
                                        onChange={e => setNoteContent(e.target.value)}
                                        className={`${inputCls} resize-none`}
                                        rows={5}
                                        placeholder="Toplantıda neler konuşuldu, kararlar, aksiyon maddeleri..."
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (!noteContent.trim()) return;
                                        if (noteModal.mode === 'complete') {
                                            completeMut.mutate({ id: noteModal.meetingId, content: noteContent.trim() });
                                        } else {
                                            addNoteMut.mutate({ id: noteModal.meetingId, content: noteContent.trim() });
                                        }
                                    }}
                                    disabled={!noteContent.trim() || completeMut.isPending || addNoteMut.isPending}
                                    className={`w-full py-3 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50
                                        ${noteModal.mode === 'complete'
                                            ? 'bg-pink-600 hover:bg-pink-500'
                                            : 'bg-amber-600 hover:bg-amber-500'}`}>
                                    {completeMut.isPending || addNoteMut.isPending
                                        ? 'Kaydediliyor...'
                                        : noteModal.mode === 'complete' ? 'Tamamla & Kaydet' : 'Notumu Kaydet'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
