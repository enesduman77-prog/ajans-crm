import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import type { CompanyResponse, CreateCompanyRequest, UpdateCompanyRequest } from '../../api/admin';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Users, ListTodo, X, Pencil, Trash2, Briefcase, Shield } from 'lucide-react';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [editingCompany, setEditingCompany] = useState<CompanyResponse | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<CompanyResponse | null>(null);
    const [editForm, setEditForm] = useState<UpdateCompanyRequest>({ name: '' });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState('');

    const [form, setForm] = useState<CreateCompanyRequest>({
        name: '', industry: '', email: '', phone: '', address: '', website: '', notes: '',
        taxId: '', foundedYear: undefined,
        socialInstagram: '', socialFacebook: '', socialTwitter: '', socialLinkedin: '', socialYoutube: '', socialTiktok: '',
        ownerFullName: '', ownerEmail: '', ownerPassword: '', ownerPhone: '', ownerPosition: '',
    });

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = () => {
        setLoading(true);
        adminApi.getCompanies()
            .then(setCompanies)
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            // Clean empty strings to undefined so backend @Email validation doesn't fail
            const payload: Record<string, any> = {};
            for (const [key, value] of Object.entries(form)) {
                payload[key] = typeof value === 'string' && value.trim() === '' ? undefined : value;
            }
            await adminApi.createCompany(payload as CreateCompanyRequest);
            setShowForm(false);
            setForm({
                name: '', industry: '', email: '', phone: '', address: '', website: '', notes: '',
                taxId: '', foundedYear: undefined,
                socialInstagram: '', socialFacebook: '', socialTwitter: '', socialLinkedin: '', socialYoutube: '', socialTiktok: '',
                ownerFullName: '', ownerEmail: '', ownerPassword: '', ownerPhone: '', ownerPosition: ''
            });
            loadCompanies();
        } catch (err: any) {
            const data = err.response?.data;
            if (data) {
                if (typeof data.message === 'string') {
                    setError(data.message);
                } else if (typeof data === 'object') {
                    // Validation errors come as { field: message } map
                    const messages = Object.values(data).filter(v => typeof v === 'string');
                    setError(messages.length > 0 ? messages.join(', ') : 'Şirket oluşturulamadı');
                } else {
                    setError('Şirket oluşturulamadı');
                }
            } else {
                setError('Şirket oluşturulamadı');
            }
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const openEdit = (e: React.MouseEvent, company: CompanyResponse) => {
        e.preventDefault();
        e.stopPropagation();
        setEditForm({
            name: company.name,
            industry: company.industry || '',
            email: company.email || '',
            phone: company.phone || '',
            address: company.address || '',
            website: company.website || '',
            notes: company.notes || '',
            taxId: company.taxId || '',
            foundedYear: company.foundedYear,
            socialInstagram: company.socialInstagram || '',
            socialFacebook: company.socialFacebook || '',
            socialTwitter: company.socialTwitter || '',
            socialLinkedin: company.socialLinkedin || '',
            socialYoutube: company.socialYoutube || '',
            socialTiktok: company.socialTiktok || '',
        });
        setEditError('');
        setEditingCompany(company);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCompany) return;
        setEditSaving(true);
        setEditError('');
        try {
            const payload: Record<string, any> = {};
            for (const [key, value] of Object.entries(editForm)) {
                payload[key] = typeof value === 'string' && value.trim() === '' ? undefined : value;
            }
            await adminApi.updateCompany(editingCompany.id, payload as UpdateCompanyRequest);
            setEditingCompany(null);
            loadCompanies();
        } catch (err: any) {
            const data = err.response?.data;
            if (data?.message) setEditError(data.message);
            else setEditError('Şirket güncellenemedi');
        } finally {
            setEditSaving(false);
        }
    };

    const updateEditField = (field: string, value: string | number) => setEditForm(prev => ({ ...prev, [field]: value }));

    const openDelete = (e: React.MouseEvent, company: CompanyResponse) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteConfirm(company);
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await adminApi.deleteCompany(deleteConfirm.id);
            setDeleteConfirm(null);
            loadCompanies();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Şirket silinemedi');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Şirketler</h1>
                    <p className="text-zinc-500 text-[13px] mt-1">Müşteri şirketlerinizi yönetin</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 text-[13px] shadow-lg shadow-orange-500/20 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Şirket
                </button>
            </div>

            {/* Company List */}
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="h-8 w-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
                </div>
            ) : companies.length === 0 ? (
                <div className="glass-panel p-16 rounded-2xl text-center">
                    <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-zinc-400">Henüz şirket yok</h3>
                    <p className="text-zinc-600 text-sm mt-1">İlk müşterinizi ekleyerek başlayın.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map((company, i) => (
                        <motion.a
                            key={company.id}
                            href={`/admin/companies/${company.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-[#0C0C0E] border border-white/[0.06] p-5 rounded-2xl hover:border-white/[0.08] transition-all group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-12 w-12 rounded-xl bg-[#18181b] flex items-center justify-center border border-white/[0.06]">
                                    {company.logoUrl ? (
                                        <img src={company.logoUrl} alt={company.name} className="w-8 h-8 rounded-lg object-cover" />
                                    ) : (
                                        <Building2 className="w-6 h-6 text-zinc-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={e => openEdit(e, company)}
                                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={e => openDelete(e, company)}
                                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${company.contractStatus === 'ACTIVE'
                                        ? 'bg-pink-500/10 text-pink-400'
                                        : 'bg-[#18181b] text-zinc-500'
                                        }`}>
                                        {company.contractStatus === 'ACTIVE' ? 'Aktif' : company.contractStatus}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">{company.name}</h3>
                            <p className="text-zinc-600 text-xs mt-0.5">{company.industry || 'Sektör belirtilmemiş'}</p>

                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                    <Users className="w-3.5 h-3.5" /> {company.employeeCount} Çalışan
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                    <Shield className="w-3.5 h-3.5" /> {company.staffCount} Yetkili
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                    <ListTodo className="w-3.5 h-3.5" /> {company.taskCount} Görev
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            )}

            {/* Create Company Modal */}
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
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-panel rounded-2xl w-full max-w-xl max-h-[90vh] overflow-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between sticky top-0 bg-[#0C0C0E] backdrop-blur z-10 rounded-t-2xl">
                                <h2 className="text-lg font-bold text-white">Yeni Şirket Oluştur</h2>
                                <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-6 space-y-6">
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>
                                )}

                                {/* Şirket Bilgileri */}
                                <div className="space-y-4">
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Şirket Bilgileri</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="col-span-1 sm:col-span-2">
                                            <input value={form.name} onChange={e => updateField('name', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Şirket Adı *" required />
                                        </div>
                                        <input value={form.industry} onChange={e => updateField('industry', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Sektör" />
                                        <input value={form.email} onChange={e => updateField('email', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Şirket Email" />
                                        <input value={form.phone} onChange={e => updateField('phone', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Telefon" />
                                        <input value={form.website} onChange={e => updateField('website', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Website" />
                                        <input value={form.taxId ?? ''} onChange={e => updateField('taxId', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Vergi No" />
                                        <input value={form.foundedYear ?? ''} onChange={e => setForm(p => ({ ...p, foundedYear: e.target.value ? parseInt(e.target.value) : undefined }))} type="number" className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Kuruluş Yılı" />
                                        <div className="col-span-1 sm:col-span-2">
                                            <input value={form.address} onChange={e => updateField('address', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Adres" />
                                        </div>
                                        <div className="col-span-1 sm:col-span-2">
                                            <textarea value={form.notes ?? ''} onChange={e => updateField('notes', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none resize-none" rows={3} placeholder="Notlar" />
                                        </div>
                                    </div>
                                </div>

                                {/* Sosyal Medya */}
                                <div className="space-y-4">
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Sosyal Medya</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input value={form.socialInstagram ?? ''} onChange={e => updateField('socialInstagram', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Instagram (@kullanıcı)" />
                                        <input value={form.socialFacebook ?? ''} onChange={e => updateField('socialFacebook', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Facebook URL" />
                                        <input value={form.socialTwitter ?? ''} onChange={e => updateField('socialTwitter', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Twitter (@kullanıcı)" />
                                        <input value={form.socialLinkedin ?? ''} onChange={e => updateField('socialLinkedin', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="LinkedIn URL" />
                                        <input value={form.socialYoutube ?? ''} onChange={e => updateField('socialYoutube', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="YouTube URL" />
                                        <input value={form.socialTiktok ?? ''} onChange={e => updateField('socialTiktok', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="TikTok (@kullanıcı)" />
                                    </div>
                                </div>

                                {/* Sahip Bilgileri */}
                                <div className="space-y-4">
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Şirket Sahibi (Otomatik Hesap Oluşturulur)</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input value={form.ownerFullName} onChange={e => updateField('ownerFullName', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Ad Soyad *" required />
                                        <input value={form.ownerEmail} onChange={e => updateField('ownerEmail', e.target.value)} type="email" className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Email *" required />
                                        <input value={form.ownerPassword} onChange={e => updateField('ownerPassword', e.target.value)} type="password" className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Şifre *" required />
                                        <input value={form.ownerPhone} onChange={e => updateField('ownerPhone', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Telefon" />
                                        <div className="col-span-1 sm:col-span-2">
                                            <input value={form.ownerPosition} onChange={e => updateField('ownerPosition', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Pozisyon (Genel Müdür, CEO vb.)" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={saving} className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-[13px] shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">
                                    {saving ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Şirketi Oluştur'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Company Modal */}
            <AnimatePresence>
                {editingCompany && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        onClick={() => setEditingCompany(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-panel rounded-2xl w-full max-w-xl max-h-[90vh] overflow-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between sticky top-0 bg-[#0C0C0E] backdrop-blur z-10 rounded-t-2xl">
                                <h2 className="text-lg font-bold text-white">Şirketi Düzenle</h2>
                                <button onClick={() => setEditingCompany(null)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="p-6 space-y-6">
                                {editError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{editError}</div>
                                )}

                                <div className="space-y-4">
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Şirket Bilgileri</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="col-span-1 sm:col-span-2">
                                            <input value={editForm.name} onChange={e => updateEditField('name', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Şirket Adı *" required />
                                        </div>
                                        <input value={editForm.industry ?? ''} onChange={e => updateEditField('industry', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Sektör" />
                                        <input value={editForm.email ?? ''} onChange={e => updateEditField('email', e.target.value)} type="email" className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Şirket Email" />
                                        <input value={editForm.phone ?? ''} onChange={e => updateEditField('phone', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Telefon" />
                                        <input value={editForm.website ?? ''} onChange={e => updateEditField('website', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Website" />
                                        <input value={editForm.taxId ?? ''} onChange={e => updateEditField('taxId', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Vergi No" />
                                        <input value={editForm.foundedYear ?? ''} onChange={e => updateEditField('foundedYear', e.target.value ? parseInt(e.target.value) : '')} type="number" className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Kuruluş Yılı" />
                                        <div className="col-span-1 sm:col-span-2">
                                            <input value={editForm.address ?? ''} onChange={e => updateEditField('address', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Adres" />
                                        </div>
                                        <div className="col-span-1 sm:col-span-2">
                                            <textarea value={editForm.notes ?? ''} onChange={e => updateEditField('notes', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none resize-none" rows={3} placeholder="Notlar" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Sosyal Medya</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input value={editForm.socialInstagram ?? ''} onChange={e => updateEditField('socialInstagram', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Instagram (@kullanıcı)" />
                                        <input value={editForm.socialFacebook ?? ''} onChange={e => updateEditField('socialFacebook', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Facebook URL" />
                                        <input value={editForm.socialTwitter ?? ''} onChange={e => updateEditField('socialTwitter', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="Twitter (@kullanıcı)" />
                                        <input value={editForm.socialLinkedin ?? ''} onChange={e => updateEditField('socialLinkedin', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="LinkedIn URL" />
                                        <input value={editForm.socialYoutube ?? ''} onChange={e => updateEditField('socialYoutube', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="YouTube URL" />
                                        <input value={editForm.socialTiktok ?? ''} onChange={e => updateEditField('socialTiktok', e.target.value)} className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white outline-none" placeholder="TikTok (@kullanıcı)" />
                                    </div>
                                </div>

                                <button type="submit" disabled={editSaving} className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-[13px] shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">
                                    {editSaving ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Değişiklikleri Kaydet'}
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
                                    <h3 className="text-white font-bold text-sm">Şirketi Sil</h3>
                                    <p className="text-zinc-500 text-xs">Bu işlem geri alınamaz</p>
                                </div>
                            </div>
                            <p className="text-zinc-400 text-sm mb-6">
                                <span className="text-white font-medium">{deleteConfirm.name}</span> şirketini silmek istediğinize emin misiniz? Şirkete ait tüm görevler ve üyelikler de silinecektir.
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
