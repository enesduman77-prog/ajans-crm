import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffApi } from '../../api/staff';
import type { CompanyResponse } from '../../api/admin';
import { motion } from 'framer-motion';
import { Building2, ChevronRight } from 'lucide-react';

export default function StaffCompaniesPage() {
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        staffApi.getCompanies()
            .then(setCompanies)
            .catch(() => setCompanies([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Şirketler</h1>
                <p className="text-zinc-600 text-sm mt-1">Atandığınız şirketler</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-zinc-600">Yükleniyor...</div>
            ) : companies.length === 0 ? (
                <div className="text-center py-20 bg-[#0C0C0E]/80 border border-white/[0.06] rounded-2xl">
                    <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">Henüz şirket atanmamış.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map((company, i) => (
                        <motion.div
                            key={company.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => navigate(`/staff/companies/${company.id}`)}
                            className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5 hover:border-pink-500/20 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-pink-900/30 flex items-center justify-center text-pink-400 font-bold text-sm">
                                    {company.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm truncate">{company.name}</p>
                                    <p className="text-zinc-600 text-xs mt-0.5">{company.industry || 'Sektör belirtilmemiş'}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-pink-400 transition-colors" />
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-4">
                                <div className="text-center flex-1">
                                    <p className="text-lg font-bold text-white">{company.memberCount || 0}</p>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Üye</p>
                                </div>
                                <div className="text-center flex-1">
                                    <p className="text-lg font-bold text-white">{company.taskCount || 0}</p>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Görev</p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase ${company.contractStatus === 'ACTIVE'
                                    ? 'bg-pink-900/30 text-pink-400'
                                    : 'bg-[#18181b] text-zinc-500'
                                    }`}>
                                    {company.contractStatus === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
