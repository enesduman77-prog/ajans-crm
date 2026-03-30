import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { staffApi } from '../api/staff';
import type { AssignableUser } from '../api/staff';
import type { CompanyResponse } from '../api/admin';

const categoryLabels: Record<string, string> = {
    REELS: 'Reels', BLOG: 'Blog', PAYLASIM: 'Paylaşım', SEO: 'SEO',
    TASARIM: 'Tasarım', TOPLANTI: 'Toplantı', OTHER: 'Diğer',
};

export default function FloatingTaskFab() {
    const [showForm, setShowForm] = useState(false);
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        companyId: '' as string | undefined,
        assignedToId: '',
        title: '',
        description: '',
        category: 'OTHER',
        priority: 'MEDIUM',
        startDate: '' as string | undefined,
        startTime: '' as string | undefined,
        endDate: '' as string | undefined,
        endTime: '' as string | undefined,
    });

    useEffect(() => {
        if (showForm) {
            staffApi.getCompanies().then(setCompanies).catch(() => { });
            staffApi.getAssignableUsers(form.companyId || undefined).then(setAssignableUsers).catch(() => { });
        }
    }, [showForm, form.companyId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.assignedToId || !form.title) return;
        setLoading(true);
        try {
            await staffApi.createTask({
                ...form,
                companyId: form.companyId || undefined,
                startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
                endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
                startTime: form.startTime || undefined,
                endTime: form.endTime || undefined,
            });
            setShowForm(false);
            setForm({ companyId: undefined, assignedToId: '', title: '', description: '', category: 'OTHER', priority: 'MEDIUM', startDate: undefined, startTime: undefined, endDate: undefined, endTime: undefined });
            window.location.reload();
        } catch { }
        setLoading(false);
    };

    return (
        <>
            <button onClick={() => setShowForm(true)}
                className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 group">
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowForm(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                                <h3 className="text-lg font-bold text-white">Hızlı Görev Oluştur</h3>
                                <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Başlık *</label>
                                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                                        placeholder="Görevin adı..." required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Atanan Kişi *</label>
                                    <select value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors" required>
                                        <option value="">Kişi seçiniz</option>
                                        {assignableUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName} ({u.globalRole === 'ADMIN' ? 'Admin' : u.globalRole === 'AGENCY_STAFF' ? 'Ajans' : 'Müşteri'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Şirket <span className="text-zinc-700">(opsiyonel)</span></label>
                                    <select value={form.companyId || ''} onChange={e => setForm(f => ({ ...f, companyId: e.target.value || undefined, assignedToId: '' }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors">
                                        <option value="">Ajans İçi</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Açıklama</label>
                                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors resize-none"
                                        rows={3} placeholder="Detaylar..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kategori</label>
                                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors">
                                            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Öncelik</label>
                                        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors">
                                            <option value="LOW">Düşük</option>
                                            <option value="MEDIUM">Orta</option>
                                            <option value="HIGH">Yüksek</option>
                                            <option value="URGENT">Acil</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Başlangıç</label>
                                        <input type="date" value={form.startDate || ''}
                                            onChange={e => setForm(f => ({ ...f, startDate: e.target.value || undefined }))}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bitiş</label>
                                        <input type="date" value={form.endDate || ''}
                                            onChange={e => setForm(f => ({ ...f, endDate: e.target.value || undefined }))}
                                            className="w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors" />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                                    {loading ? 'Oluşturuluyor...' : 'Görevi Başlat'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
