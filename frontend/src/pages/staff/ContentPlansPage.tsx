import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import type { CompanyResponse } from '../../api/admin';
import { ContentPlanPanel } from '../../components/analytics';
import {
    PenLine, Building2, Search
} from 'lucide-react';

export default function ContentPlansPage() {
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [search, setSearch] = useState('');

    const { data: companies = [] } = useQuery<CompanyResponse[]>({
        queryKey: ['staff-companies'],
        queryFn: () => staffApi.getCompanies(),
    });

    const filtered = companies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
                            <PenLine className="w-5 h-5 text-violet-400" />
                        </div>
                        İçerik Planları
                    </h1>
                    <p className="text-zinc-500 text-[13px] mt-1 ml-[52px]">Şirketlere içerik oluşturun ve yönetin</p>
                </div>
            </div>

            {/* Company selector */}
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 text-zinc-500" />
                    <h3 className="text-sm font-semibold text-zinc-400">Şirket Seçin</h3>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Şirket ara..."
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-10 pr-3 py-2.5 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
                    />
                </div>

                {/* Company chips */}
                <div className="flex flex-wrap gap-2">
                    {filtered.map(company => (
                        <button
                            key={company.id}
                            onClick={() => setSelectedCompanyId(
                                selectedCompanyId === company.id ? '' : company.id
                            )}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium transition-all duration-200 ${
                                selectedCompanyId === company.id
                                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-300'
                            }`}
                        >
                            <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                selectedCompanyId === company.id
                                    ? 'bg-violet-500/20 text-violet-400'
                                    : 'bg-white/[0.05] text-zinc-500'
                            }`}>
                                {company.name.charAt(0)}
                            </div>
                            {company.name}
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-zinc-600 text-sm py-2">Şirket bulunamadı</p>
                    )}
                </div>
            </div>

            {/* Content Plan Panel */}
            {selectedCompanyId ? (
                <ContentPlanPanel companyId={selectedCompanyId} />
            ) : (
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                        <PenLine className="w-7 h-7 text-violet-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">İçerik planı oluşturmak için şirket seçin</h3>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                        Yukarıdan bir şirket seçtikten sonra o şirkete ait içerik planlarını görüntüleyebilir,
                        yeni içerik ekleyebilir ve durum güncellemeleri yapabilirsiniz.
                    </p>
                </div>
            )}
        </div>
    );
}
