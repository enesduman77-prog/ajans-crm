import { useEffect, useState } from 'react';
import { clientApi } from '../../api/clientPanel';
import type { TeamMemberResponse } from '../../api/clientPanel';
import { motion } from 'framer-motion';
import { Users, Briefcase, Mail, Phone, Shield } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
    OWNER: 'Şirket Sahibi',
    EMPLOYEE: 'Çalışan',
    AGENCY_STAFF: 'Ajans Çalışanı',
};

export default function ClientTeamPage() {
    const [agencyStaff, setAgencyStaff] = useState<TeamMemberResponse[]>([]);
    const [employees, setEmployees] = useState<TeamMemberResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        try {
            const data = await clientApi.getTeam();
            setAgencyStaff(data.agencyStaff);
            setEmployees(data.employees);
        } catch { }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-60">
                <div className="h-8 w-8 border-2 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Ekibimiz</h1>
                <p className="text-zinc-500 text-sm mt-1">Şirketinize atanmış ajans ekibi ve çalışanlarınız</p>
            </div>

            {/* Agency Staff Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Ajans Ekibi</h2>
                        <p className="text-xs text-zinc-500">Şirketinize atanmış ajans çalışanları</p>
                    </div>
                    <span className="ml-auto text-xs bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-lg font-medium">
                        {agencyStaff.length} kişi
                    </span>
                </div>

                {agencyStaff.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-10 text-center">
                        <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">Henüz atanmış ajans çalışanı yok</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {agencyStaff.map((member, i) => (
                            <MemberCard key={member.id} member={member} index={i} accent="pink" />
                        ))}
                    </div>
                )}
            </section>

            {/* Employees Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Şirket Çalışanları</h2>
                        <p className="text-xs text-zinc-500">Şirketinizdeki diğer kullanıcılar</p>
                    </div>
                    <span className="ml-auto text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg font-medium">
                        {employees.length} kişi
                    </span>
                </div>

                {employees.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-10 text-center">
                        <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">Henüz şirket çalışanı yok</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {employees.map((member, i) => (
                            <MemberCard key={member.id} member={member} index={i} accent="blue" />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function MemberCard({ member, index, accent }: { member: TeamMemberResponse; index: number; accent: 'pink' | 'blue' }) {
    const accentStyles = {
        pink: {
            badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
            avatar: 'bg-pink-500/10 text-pink-400',
        },
        blue: {
            badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            avatar: 'bg-blue-500/10 text-blue-400',
        },
    }[accent];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-panel rounded-2xl p-5 hover:bg-white/[0.02] transition-colors"
        >
            <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl ${accentStyles.avatar} flex items-center justify-center shrink-0 overflow-hidden`}>
                    {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm font-bold">
                            {member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{member.fullName}</p>
                    <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md border mt-1 ${accentStyles.badge}`}>
                        {ROLE_LABELS[member.membershipRole] || member.membershipRole}
                    </span>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                {member.position && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Briefcase className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        <span className="truncate">{member.position}{member.department ? ` · ${member.department}` : ''}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Mail className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <span className="truncate">{member.email}</span>
                </div>
                {member.phone && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Phone className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        <span>{member.phone}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
