import { useEffect, useRef, useState } from 'react';
import { adminApi } from '../../api/admin';
import type { StaffResponse, CreateStaffRequest, CompanyResponse } from '../../api/admin';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Building2, Trash2 } from 'lucide-react';

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffResponse[]>([]);
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState<CreateStaffRequest>({
        fullName: '', email: '', password: '', phone: '', position: '', department: '', initialCompanyId: ''
    });
    const [openAssignId, setOpenAssignId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<StaffResponse | null>(null);
    const assignDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (assignDropdownRef.current && !assignDropdownRef.current.contains(e.target as Node)) {
                setOpenAssignId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [s, c] = await Promise.all([adminApi.getStaff(), adminApi.getCompanies()]);
            setStaff(s);
            setCompanies(c);
        } catch { }
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            // Clean empty strings to undefined
            const payload: Record<string, any> = {};
            for (const [key, value] of Object.entries(form)) {
                payload[key] = typeof value === 'string' && value.trim() === '' ? undefined : value;
            }
            await adminApi.createStaff(payload as CreateStaffRequest);
            setShowForm(false);
            setForm({ fullName: '', email: '', password: '', phone: '', position: '', department: '', initialCompanyId: '' });
            loadData();
        } catch (err: any) {
            const data = err.response?.data;
            if (data) {
                if (typeof data.message === 'string') {
                    setError(data.message);
                } else if (typeof data === 'object') {
                    const messages = Object.values(data).filter(v => typeof v === 'string');
                    setError(messages.length > 0 ? messages.join(', ') : 'Çalışan oluşturulamadı');
                } else {
                    setError('Çalışan oluşturulamadı');
                }
            } else {
                setError('Çalışan oluşturulamadı');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleAssign = async (staffId: string, companyId: string) => {
        try {
            await adminApi.assignStaff(staffId, companyId);
            setOpenAssignId(null);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Atama başarısız');
        }
    };

    const handleUnassign = async (membershipId: string) => {
        try {
            await adminApi.unassignStaff(membershipId);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Çıkarma başarısız');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await adminApi.deleteStaff(deleteConfirm.id);
            setDeleteConfirm(null);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Çalışan silinemedi');
        }
    };

    const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Çalışanlar</h1>
                    <p className="text-zinc-500 text-sm mt-1">Ajans ekibinizi yönetin</p>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 text-[13px] shadow-lg shadow-orange-500/20 transition-all">
                    <Plus className="w-4 h-4" /> Yeni Çalışan
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="h-8 w-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
                </div>
            ) : staff.length === 0 ? (
                <div className="glass-panel p-16 rounded-2xl text-center">
                    <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-zinc-400">Henüz çalışan yok</h3>
                    <p className="text-zinc-600 text-sm mt-1">İlk çalışanınızı ekleyerek başlayın.</p>
                </div>
            ) : (
                <div className="glass-panel rounded-2xl overflow-visible">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                <th className="text-left p-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Çalışan</th>
                                <th className="text-left p-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Pozisyon</th>
                                <th className="text-left p-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Atandığı Şirketler</th>
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((s, i) => {
                                const availableForStaff = companies.filter(c => !s.assignedCompanies.find(ac => ac.companyId === c.id));
                                return (
                                    <motion.tr
                                        key={s.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">
                                                    {s.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <a href={`/admin/staff/${s.id}`} className="text-sm font-medium text-white hover:text-orange-400 transition-colors">{s.fullName}</a>
                                                    <p className="text-[11px] text-zinc-600">{s.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-zinc-400">{s.position || '-'}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {s.assignedCompanies.map(ac => (
                                                    <span key={ac.membershipId} className="inline-flex items-center gap-1 text-[11px] bg-[#18181b] border border-white/[0.06] text-zinc-300 pl-2 pr-1 py-0.5 rounded-lg">
                                                        <Building2 className="w-3 h-3 text-zinc-500" />
                                                        {ac.companyName}
                                                        <button
                                                            onClick={() => handleUnassign(ac.membershipId)}
                                                            className="ml-0.5 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 text-zinc-500 transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                {availableForStaff.length > 0 && (
                                                    <div className="relative" ref={openAssignId === s.id ? assignDropdownRef : null}>
                                                        <button
                                                            onClick={() => setOpenAssignId(openAssignId === s.id ? null : s.id)}
                                                            className="inline-flex items-center gap-1 text-[11px] border border-dashed border-white/[0.12] text-zinc-500 hover:text-orange-400 hover:border-orange-500/40 px-2 py-0.5 rounded-lg transition-colors"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            Ekle
                                                        </button>
                                                        <AnimatePresence>
                                                            {openAssignId === s.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                                                    transition={{ duration: 0.12 }}
                                                                    className="absolute left-0 top-7 z-30 bg-[#18181b] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden min-w-[180px]"
                                                                >
                                                                    {availableForStaff.map(c => (
                                                                        <button
                                                                            key={c.id}
                                                                            onClick={() => handleAssign(s.id, c.id)}
                                                                            className="w-full text-left px-3 py-2 text-[12px] text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors flex items-center gap-2"
                                                                        >
                                                                            <Building2 className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                                                                            {c.name}
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                                {s.assignedCompanies.length === 0 && availableForStaff.length === 0 && (
                                                    <span className="text-xs text-zinc-600">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => setDeleteConfirm(s)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                                                title="Çalışanı Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Staff Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="glass-panel rounded-2xl w-full max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Yeni Çalışan Ekle</h2>
                                <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}
                                <input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Ad Soyad *" required />
                                <input value={form.email} onChange={e => updateField('email', e.target.value)} type="email" className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Email *" required />
                                <input value={form.password} onChange={e => updateField('password', e.target.value)} type="password" className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Şifre *" required />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input value={form.phone} onChange={e => updateField('phone', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Telefon" />
                                    <input value={form.position} onChange={e => updateField('position', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Pozisyon" />
                                </div>
                                <input value={form.department} onChange={e => updateField('department', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Departman" />
                                <select
                                    value={form.initialCompanyId || ''}
                                    onChange={e => updateField('initialCompanyId', e.target.value)}
                                    className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none"
                                >
                                    <option value="">(İsteğe Bağlı) Bir Şirkete Ata</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <button type="submit" disabled={saving} className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-[13px] shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">
                                    {saving ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Çalışanı Oluştur'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="glass-panel rounded-2xl w-full max-w-sm p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Çalışanı Sil</h3>
                                    <p className="text-zinc-500 text-xs">Bu işlem geri alınamaz</p>
                                </div>
                            </div>
                            <p className="text-zinc-400 text-sm mb-6">
                                <span className="text-white font-medium">{deleteConfirm.fullName}</span> adlı çalışanı silmek istediğinize emin misiniz? Tüm şirket atamaları da kaldırılacaktır.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-white/[0.06] text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors"
                                >
                                    Sil
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
