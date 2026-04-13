import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type StaffResponse, type CompanyResponse } from '../../api/admin';
import {
    ArrowLeft, User, Mail, Phone, Briefcase, Building2,
    Plus, Trash2
} from 'lucide-react';

export default function StaffDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [showAssign, setShowAssign] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    const { data: staff, isLoading } = useQuery<StaffResponse>({
        queryKey: ['staff', id],
        queryFn: () => adminApi.getStaffById(id!),
        enabled: !!id,
    });

    const { data: companies } = useQuery<CompanyResponse[]>({
        queryKey: ['companies'],
        queryFn: () => adminApi.getCompanies(),
        enabled: showAssign,
    });

    const assignMutation = useMutation({
        mutationFn: (companyId: string) => adminApi.assignStaff(id!, companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff', id] });
            setShowAssign(false);
            setSelectedCompanyId('');
        },
    });

    const unassignMutation = useMutation({
        mutationFn: (membershipId: string) => adminApi.unassignStaff(membershipId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff', id] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!staff) return <div className="text-zinc-500 text-center py-12">Çalışan bulunamadı</div>;

    const assignedIds = staff.assignedCompanies.map(c => c.companyId);
    const availableCompanies = companies?.filter(c => !assignedIds.includes(c.id)) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/staff')}
                    className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center">
                        {staff.avatarUrl ? (
                            <img src={staff.avatarUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                        ) : (
                            <span className="text-xl font-bold text-orange-400">{staff.fullName?.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{staff.fullName}</h1>
                        <p className="text-sm text-zinc-500">Ajans Çalışanı</p>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Kişisel Bilgiler</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-zinc-600" />
                            <span className="text-white">{staff.email}</span>
                        </div>
                        {staff.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-zinc-600" />
                                <span className="text-white">{staff.phone}</span>
                            </div>
                        )}
                        {staff.position && (
                            <div className="flex items-center gap-2 text-sm">
                                <Briefcase className="w-4 h-4 text-zinc-600" />
                                <span className="text-zinc-400">Pozisyon:</span>
                                <span className="text-white">{staff.position}</span>
                            </div>
                        )}
                        {staff.department && (
                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-zinc-600" />
                                <span className="text-zinc-400">Departman:</span>
                                <span className="text-white">{staff.department}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">İstatistikler</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[#18181b]/50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-white">{staff.assignedCompanies.length}</p>
                            <p className="text-xs text-zinc-500 mt-1">Atandığı Şirket</p>
                        </div>
                        <div className="bg-[#18181b]/50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-emerald-400">{staff.globalRole === 'AGENCY_STAFF' ? 'Aktif' : '-'}</p>
                            <p className="text-xs text-zinc-500 mt-1">Durum</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assigned Companies */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Atandığı Şirketler ({staff.assignedCompanies.length})
                    </h3>
                    <button onClick={() => setShowAssign(!showAssign)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors">
                        <Plus className="w-4 h-4" />
                        Şirkete Ata
                    </button>
                </div>

                {/* Assign Form */}
                {showAssign && (
                    <div className="mb-4 p-4 bg-[#18181b]/60 rounded-xl border border-white/[0.06] flex items-center gap-3">
                        <select value={selectedCompanyId}
                            onChange={e => setSelectedCompanyId(e.target.value)}
                            className="flex-1 bg-[#111113] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none">
                            <option value="">Şirket seçin...</option>
                            {availableCompanies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <button onClick={() => selectedCompanyId && assignMutation.mutate(selectedCompanyId)}
                            disabled={!selectedCompanyId || assignMutation.isPending}
                            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors">
                            {assignMutation.isPending ? 'Atanıyor...' : 'Ata'}
                        </button>
                    </div>
                )}

                {/* Company List */}
                <div className="space-y-2">
                    {staff.assignedCompanies.map((ac) => (
                        <div key={ac.companyId}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
                            <div className="h-9 w-9 rounded-lg bg-[#18181b] flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <button onClick={() => navigate(`/admin/companies/${ac.companyId}`)}
                                    className="text-sm font-medium text-white hover:text-orange-400 transition-colors">
                                    {ac.companyName}
                                </button>
                                <p className="text-xs text-zinc-600">{ac.membershipRole}</p>
                            </div>
                            <button
                                onClick={() => {
                                    if (confirm(`${ac.companyName} şirketinden çıkarılsın mı?`)) {
                                        unassignMutation.mutate(ac.membershipId);
                                    }
                                }}
                                className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {staff.assignedCompanies.length === 0 && (
                        <p className="text-zinc-600 text-sm text-center py-6">
                            Henüz bir şirkete atanmamış
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
