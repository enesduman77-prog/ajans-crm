import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import type { CompanyResponse } from '../../api/admin';
import {
    ArrowLeft, Building2, Users, Mail, Phone, Globe, MapPin, Calendar,
    ChevronDown, ChevronUp, Briefcase, ExternalLink,
    Instagram, Facebook, Twitter, Linkedin, Youtube
} from 'lucide-react';
import { useState } from 'react';
import type { MembershipInfo } from '../../api/admin';

export default function StaffCompanyDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedMember, setSelectedMember] = useState<MembershipInfo | null>(null);

    const { data: company, isLoading } = useQuery<CompanyResponse>({
        queryKey: ['staff-company', id],
        queryFn: () => staffApi.getCompany(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!company) return <div className="text-zinc-500 text-center py-12">Şirket bulunamadı</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/staff/companies')}
                    className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                            <div className="flex items-center gap-3 text-sm text-zinc-500">
                                {company.industry && <span>{company.industry}</span>}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${company.contractStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                    {company.contractStatus === 'ACTIVE' ? 'Aktif' : company.contractStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Contact */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">İletişim</h3>
                    {company.email && (
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-zinc-600" />
                            <span className="text-white">{company.email}</span>
                        </div>
                    )}
                    {company.phone && (
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-zinc-600" />
                            <span className="text-white">{company.phone}</span>
                        </div>
                    )}
                    {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                            <Globe className="w-4 h-4" />
                            <span>{company.website}</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                    {company.address && (
                        <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-zinc-600 mt-0.5" />
                            <span className="text-zinc-300">{company.address}</span>
                        </div>
                    )}
                    {!company.email && !company.phone && !company.website && !company.address && (
                        <p className="text-zinc-600 text-sm">İletişim bilgisi eklenmemiş</p>
                    )}
                </div>

                {/* Details */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Detaylar</h3>
                    {company.taxId && (
                        <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="w-4 h-4 text-zinc-600" />
                            <span className="text-zinc-400">Vergi No:</span>
                            <span className="text-white">{company.taxId}</span>
                        </div>
                    )}
                    {company.foundedYear && (
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-zinc-600" />
                            <span className="text-zinc-400">Kuruluş:</span>
                            <span className="text-white">{company.foundedYear}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-zinc-400">Çalışan:</span>
                        <span className="text-white font-medium">{company.employeeCount}</span>
                        <span className="text-zinc-400">Yetkili:</span>
                        <span className="text-white font-medium">{company.staffCount}</span>
                        <span className="text-zinc-400">Görev:</span>
                        <span className="text-white font-medium">{company.taskCount}</span>
                    </div>
                </div>

                {/* Socials */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Sosyal Medya</h3>
                    <div className="flex flex-wrap gap-2">
                        {company.socialInstagram && (
                            <a href={`https://instagram.com/${company.socialInstagram}`} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-600/10 text-pink-400 hover:from-pink-500/20 hover:to-purple-600/20 transition-colors">
                                <Instagram className="w-4 h-4" />
                            </a>
                        )}
                        {company.socialFacebook && (
                            <a href={company.socialFacebook} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                        )}
                        {company.socialTwitter && (
                            <a href={company.socialTwitter} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                        )}
                        {company.socialLinkedin && (
                            <a href={company.socialLinkedin} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        )}
                        {company.socialYoutube && (
                            <a href={company.socialYoutube} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                                <Youtube className="w-4 h-4" />
                            </a>
                        )}
                        {!company.socialInstagram && !company.socialFacebook && !company.socialTwitter &&
                            !company.socialLinkedin && !company.socialYoutube && (
                                <p className="text-zinc-600 text-sm">Sosyal medya bağlantısı eklenmemiş</p>
                            )}
                    </div>
                </div>
            </div>

            {/* Notes */}
            {company.notes && (
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Notlar</h3>
                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{company.notes}</p>
                </div>
            )}

            {/* Members */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Üyeler ({company.members?.length || 0})
                    </h3>
                </div>

                {/* Owner */}
                {company.members?.filter(m => m.membershipRole === 'OWNER').length! > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Şirket Sahibi
                        </h4>
                        <div className="space-y-2">
                            {company.members?.filter(m => m.membershipRole === 'OWNER').map((member) => (
                                <MemberRow key={member.id} member={member} selectedMember={selectedMember}
                                    onSelect={setSelectedMember}
                                    avatarBg="bg-amber-500/10" avatarText="text-amber-400"
                                    badgeBg="bg-amber-500/10" badgeText="text-amber-400" badgeLabel="Sahip" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Employees */}
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        Çalışanlar ({company.members?.filter(m => m.membershipRole === 'EMPLOYEE').length || 0})
                    </h4>
                    <div className="space-y-2">
                        {company.members?.filter(m => m.membershipRole === 'EMPLOYEE').map((member) => (
                            <MemberRow key={member.id} member={member} selectedMember={selectedMember}
                                onSelect={setSelectedMember}
                                avatarBg="bg-zinc-800" avatarText="text-zinc-400"
                                badgeBg="bg-zinc-700/50" badgeText="text-zinc-400" badgeLabel="Çalışan" />
                        ))}
                        {(!company.members || company.members.filter(m => m.membershipRole === 'EMPLOYEE').length === 0) && (
                            <p className="text-zinc-600 text-sm text-center py-2">Henüz çalışan eklenmemiş</p>
                        )}
                    </div>
                </div>

                {/* Agency Staff */}
                <div>
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Yetkililer ({company.members?.filter(m => m.membershipRole === 'AGENCY_STAFF').length || 0})
                    </h4>
                    <div className="space-y-2">
                        {company.members?.filter(m => m.membershipRole === 'AGENCY_STAFF').map((member) => (
                            <MemberRow key={member.id} member={member} selectedMember={selectedMember}
                                onSelect={setSelectedMember}
                                avatarBg="bg-emerald-500/10" avatarText="text-emerald-400"
                                badgeBg="bg-emerald-500/10" badgeText="text-emerald-400" badgeLabel="Ajans Yetkilisi" />
                        ))}
                        {(!company.members || company.members.filter(m => m.membershipRole === 'AGENCY_STAFF').length === 0) && (
                            <p className="text-zinc-600 text-sm text-center py-2">Henüz yetkili atanmamış</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Member Detail */}
            {selectedMember && (
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                        {selectedMember.fullName} — Detay
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-xl font-bold text-white">
                            {selectedMember.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="space-y-1">
                            <p className="text-white font-medium">{selectedMember.fullName}</p>
                            <p className="text-zinc-500 text-sm">{selectedMember.email}</p>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-zinc-600">Rol:</span>
                                <span className="text-emerald-400 font-medium">
                                    {selectedMember.membershipRole === 'OWNER' ? 'Sahip' :
                                        selectedMember.membershipRole === 'EMPLOYEE' ? 'Çalışan' : 'Ajans Yetkilisi'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MemberRow({ member, selectedMember, onSelect, avatarBg, avatarText, badgeBg, badgeText, badgeLabel }: {
    member: MembershipInfo;
    selectedMember: MembershipInfo | null;
    onSelect: (m: MembershipInfo | null) => void;
    avatarBg: string; avatarText: string; badgeBg: string; badgeText: string; badgeLabel: string;
}) {
    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedMember?.id === member.id ? 'bg-white/5 ring-1 ring-emerald-500/30' : 'hover:bg-white/[0.02]'}`}
            onClick={() => onSelect(selectedMember?.id === member.id ? null : member)}>
            <div className={`h-9 w-9 rounded-full ${avatarBg} flex items-center justify-center text-sm font-bold ${avatarText}`}>
                {member.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{member.fullName}</p>
                <p className="text-xs text-zinc-600 truncate">{member.email}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${badgeBg} ${badgeText}`}>
                {badgeLabel}
            </span>
            {selectedMember?.id === member.id ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
        </div>
    );
}
