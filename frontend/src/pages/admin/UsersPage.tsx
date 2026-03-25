import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import type { AllUserResponse } from '../../api/admin';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Search, Shield, Briefcase, Building2, ChevronDown } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Yönetici',
    AGENCY_STAFF: 'Ajans Çalışanı',
    COMPANY_USER: 'Şirket Kullanıcısı',
};

const MEMBERSHIP_LABELS: Record<string, string> = {
    OWNER: 'Şirket Sahibi',
    EMPLOYEE: 'Şirket Çalışanı',
    AGENCY_STAFF: 'Ajans Çalışanı',
};

const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    AGENCY_STAFF: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    COMPANY_USER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function UsersPage() {
    const [users, setUsers] = useState<AllUserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [editingUser, setEditingUser] = useState<AllUserResponse | null>(null);
    const [newRole, setNewRole] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getAllUsers();
            setUsers(data);
        } catch {
            setError('Kullanıcılar yüklenemedi');
        }
        setLoading(false);
    };

    const handleUpdateRole = async () => {
        if (!editingUser || !newRole) return;
        setSaving(true);
        setError('');
        try {
            await adminApi.updateUserRole(editingUser.id, newRole);
            setEditingUser(null);
            setNewRole('');
            loadUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Rol güncellenemedi');
        }
        setSaving(false);
    };

    const openEditModal = (user: AllUserResponse) => {
        setEditingUser(user);
        setNewRole(user.globalRole);
        setError('');
    };

    const filtered = users.filter(u => {
        const matchesSearch = search.trim() === '' ||
            u.fullName.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.globalRole === roleFilter;
        return matchesSearch && matchesRole;
    });

    const roleCounts = {
        ALL: users.length,
        ADMIN: users.filter(u => u.globalRole === 'ADMIN').length,
        AGENCY_STAFF: users.filter(u => u.globalRole === 'AGENCY_STAFF').length,
        COMPANY_USER: users.filter(u => u.globalRole === 'COMPANY_USER').length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Kullanıcılar</h1>
                <p className="text-zinc-500 text-sm mt-1">Sistemdeki tüm kayıtlı kullanıcıları yönetin</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { key: 'ALL', label: 'Toplam', count: roleCounts.ALL, color: 'text-white', bg: 'bg-white/[0.04]' },
                    { key: 'ADMIN', label: 'Yönetici', count: roleCounts.ADMIN, color: 'text-orange-400', bg: 'bg-orange-500/[0.06]' },
                    { key: 'AGENCY_STAFF', label: 'Ajans Çalışanı', count: roleCounts.AGENCY_STAFF, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.06]' },
                    { key: 'COMPANY_USER', label: 'Şirket Kullanıcısı', count: roleCounts.COMPANY_USER, color: 'text-blue-400', bg: 'bg-blue-500/[0.06]' },
                ].map(stat => (
                    <button
                        key={stat.key}
                        onClick={() => setRoleFilter(stat.key)}
                        className={`p-4 rounded-2xl border transition-all text-left ${roleFilter === stat.key
                            ? 'border-orange-500/30 bg-orange-500/[0.04]'
                            : 'border-white/[0.06] hover:border-white/[0.1] ' + stat.bg
                            }`}
                    >
                        <p className="text-[11px] text-zinc-500 font-medium">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.count}</p>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="İsim veya email ile ara..."
                    className="w-full pl-11 pr-4 py-3 bg-[#111113] border border-white/[0.06] rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/30 transition-colors"
                />
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center justify-between"
                    >
                        {error}
                        <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="h-8 w-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel p-16 rounded-2xl text-center">
                    <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-zinc-400">Kullanıcı bulunamadı</h3>
                    <p className="text-zinc-600 text-sm mt-1">Arama kriterlerinize uygun kullanıcı yok.</p>
                </div>
            ) : (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left p-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Kullanıcı</th>
                                    <th className="text-left p-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Rol</th>
                                    <th className="text-left p-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest hidden md:table-cell">Pozisyon</th>
                                    <th className="text-left p-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Şirketler</th>
                                    <th className="text-left p-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Kayıt Tarihi</th>
                                    <th className="text-left p-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u, i) => (
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 overflow-hidden shrink-0">
                                                    {u.avatarUrl ? (
                                                        <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{u.fullName}</p>
                                                    <p className="text-[11px] text-zinc-600 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${ROLE_COLORS[u.globalRole] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                                    <Shield className="w-3 h-3" />
                                                    {ROLE_LABELS[u.globalRole] || u.globalRole}
                                                </span>
                                                {u.membershipRole && u.globalRole === 'COMPANY_USER' && (
                                                    <p className="text-[10px] text-zinc-500 pl-1">
                                                        {MEMBERSHIP_LABELS[u.membershipRole] || u.membershipRole}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <div className="space-y-0.5">
                                                {u.position && (
                                                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                                                        <Briefcase className="w-3 h-3 text-zinc-600" />
                                                        {u.position}
                                                    </div>
                                                )}
                                                {u.department && (
                                                    <p className="text-[11px] text-zinc-600 pl-[18px]">{u.department}</p>
                                                )}
                                                {!u.position && !u.department && (
                                                    <span className="text-xs text-zinc-700">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <div className="flex flex-wrap gap-1.5">
                                                {u.companies.length > 0 ? u.companies.map(c => (
                                                    <span key={c.companyId} className="inline-flex items-center gap-1 text-[10px] bg-[#18181b] text-zinc-300 px-2 py-1 rounded-lg">
                                                        <Building2 className="w-2.5 h-2.5 text-zinc-500" />
                                                        {c.companyName}
                                                    </span>
                                                )) : <span className="text-xs text-zinc-700">—</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <span className="text-xs text-zinc-500">
                                                {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => openEditModal(u)}
                                                className="text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white px-3 py-2 rounded-lg transition-all flex items-center gap-1.5"
                                            >
                                                Düzenle
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            <AnimatePresence>
                {editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        onClick={() => setEditingUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="glass-panel rounded-2xl w-full max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Kullanıcı Rolünü Güncelle</h2>
                                <button onClick={() => setEditingUser(null)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                {/* User Info */}
                                <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                    <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                                        {editingUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{editingUser.fullName}</p>
                                        <p className="text-[11px] text-zinc-500 truncate">{editingUser.email}</p>
                                    </div>
                                </div>

                                {/* Role Select */}
                                <div>
                                    <label className="text-xs font-medium text-zinc-400 mb-2 block">Global Rol</label>
                                    <div className="space-y-2">
                                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                            <button
                                                key={key}
                                                onClick={() => setNewRole(key)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${newRole === key
                                                    ? 'border-orange-500/40 bg-orange-500/[0.06]'
                                                    : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]'
                                                    }`}
                                            >
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${newRole === key ? 'bg-orange-500/20' : 'bg-white/[0.04]'}`}>
                                                    <Shield className={`w-4 h-4 ${newRole === key ? 'text-orange-400' : 'text-zinc-500'}`} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${newRole === key ? 'text-white' : 'text-zinc-400'}`}>{label}</p>
                                                    <p className="text-[10px] text-zinc-600">
                                                        {key === 'ADMIN' && 'Tam yetkili sistem yöneticisi'}
                                                        {key === 'AGENCY_STAFF' && 'Ajans çalışanı, görev ve şirket yönetimi'}
                                                        {key === 'COMPANY_USER' && 'Şirket kullanıcısı, müşteri paneli erişimi'}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Companies Info */}
                                {editingUser.companies.length > 0 && (
                                    <div>
                                        <label className="text-xs font-medium text-zinc-400 mb-2 block">Bağlı Şirketler</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {editingUser.companies.map(c => (
                                                <span key={c.companyId} className="inline-flex items-center gap-1 text-[11px] bg-[#18181b] text-zinc-300 px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                                                    <Building2 className="w-3 h-3 text-zinc-500" />
                                                    {c.companyName}
                                                    <span className="text-zinc-600">·</span>
                                                    <span className="text-zinc-500">{MEMBERSHIP_LABELS[c.membershipRole] || c.membershipRole}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Save */}
                                <button
                                    onClick={handleUpdateRole}
                                    disabled={saving || newRole === editingUser.globalRole}
                                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-[13px] shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
                                >
                                    {saving ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Rolü Güncelle'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
