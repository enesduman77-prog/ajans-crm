import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    LayoutTemplate, Plus, Pencil, Trash2, Save, X, Loader2,
} from 'lucide-react';
import { adminApi, type CompanyResponse } from '../../api/admin';
import { webDesignApi, type MaintenanceLogEntry, type MaintenanceLogRequest } from '../../api/webDesign';

interface Props {
    company: CompanyResponse;
}

const CATEGORY_OPTIONS = [
    { value: 'update', label: 'Güncelleme' },
    { value: 'fix', label: 'Hata Düzeltme' },
    { value: 'feature', label: 'Yeni Özellik' },
    { value: 'security', label: 'Güvenlik' },
    { value: 'content', label: 'İçerik' },
    { value: 'seo', label: 'SEO' },
    { value: 'other', label: 'Diğer' },
];

interface InfraForm {
    hostingProvider: string;
    domainExpiry: string;
    sslExpiry: string;
    cmsType: string;
    cmsVersion: string;
    themeName: string;
}

function infraFormFromCompany(c: CompanyResponse): InfraForm {
    return {
        hostingProvider: c.hostingProvider ?? '',
        domainExpiry: c.domainExpiry ?? '',
        sslExpiry: c.sslExpiry ?? '',
        cmsType: c.cmsType ?? '',
        cmsVersion: c.cmsVersion ?? '',
        themeName: c.themeName ?? '',
    };
}

function todayIsoLocal(): string {
    const now = new Date();
    const tz = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - tz).toISOString().slice(0, 16);
}

function emptyLogForm(): MaintenanceLogRequest {
    return {
        title: '',
        description: '',
        category: 'update',
        performedAt: new Date().toISOString(),
    };
}

function inputClass() {
    return 'bg-[#0C0C0E] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[#C8697A]/50 focus:outline-none w-full';
}

function labelClass() {
    return 'text-[11px] uppercase tracking-wider text-zinc-500 mb-1 block';
}

export default function WebDesignAdminSection({ company }: Props) {
    const queryClient = useQueryClient();
    const companyId = company.id;

    const [infraForm, setInfraForm] = useState<InfraForm>(() => infraFormFromCompany(company));
    const [infraDirty, setInfraDirty] = useState(false);
    const [companySnapshotId, setCompanySnapshotId] = useState(company.id);

    if (companySnapshotId !== company.id) {
        setCompanySnapshotId(company.id);
        setInfraForm(infraFormFromCompany(company));
        setInfraDirty(false);
    }

    const saveInfra = useMutation({
        mutationFn: () => adminApi.updateCompanyInfrastructure(companyId, {
            hostingProvider: infraForm.hostingProvider || null,
            domainExpiry: infraForm.domainExpiry || null,
            sslExpiry: infraForm.sslExpiry || null,
            cmsType: infraForm.cmsType || null,
            cmsVersion: infraForm.cmsVersion || null,
            themeName: infraForm.themeName || null,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company', companyId] });
            setInfraDirty(false);
        },
    });

    const updateInfra = (key: keyof InfraForm, value: string) => {
        setInfraForm(prev => ({ ...prev, [key]: value }));
        setInfraDirty(true);
    };

    // ── Maintenance log ────────────────────────────────────────────────────
    const { data: log = [], isLoading: logLoading } = useQuery<MaintenanceLogEntry[]>({
        queryKey: ['maintenance-log', companyId],
        queryFn: () => webDesignApi.getCompanyMaintenanceLog(companyId),
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [logForm, setLogForm] = useState<MaintenanceLogRequest>(emptyLogForm());
    const [performedAtLocal, setPerformedAtLocal] = useState<string>(todayIsoLocal());

    const createLog = useMutation({
        mutationFn: (data: MaintenanceLogRequest) => webDesignApi.createMaintenanceLog(companyId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-log', companyId] });
            resetForm();
        },
    });

    const updateLog = useMutation({
        mutationFn: ({ id, data }: { id: string; data: MaintenanceLogRequest }) =>
            webDesignApi.updateMaintenanceLog(companyId, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-log', companyId] });
            resetForm();
        },
    });

    const deleteLog = useMutation({
        mutationFn: (id: string) => webDesignApi.deleteMaintenanceLog(companyId, id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance-log', companyId] }),
    });

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setLogForm(emptyLogForm());
        setPerformedAtLocal(todayIsoLocal());
    };

    const startEdit = (entry: MaintenanceLogEntry) => {
        setEditingId(entry.id);
        setShowForm(true);
        setLogForm({
            title: entry.title,
            description: entry.description ?? '',
            category: entry.category,
            performedAt: entry.performedAt,
        });
        const tz = new Date().getTimezoneOffset() * 60_000;
        const localIso = new Date(new Date(entry.performedAt).getTime() - tz).toISOString().slice(0, 16);
        setPerformedAtLocal(localIso);
    };

    const submitLog = () => {
        const performedAt = new Date(performedAtLocal).toISOString();
        const data: MaintenanceLogRequest = { ...logForm, performedAt };
        if (editingId) {
            updateLog.mutate({ id: editingId, data });
        } else {
            createLog.mutate(data);
        }
    };

    return (
        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5 space-y-6">
            <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-[#F5BEC8]" />
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Web Tasarım</h3>
            </div>

            {/* Infrastructure form */}
            <div>
                <h4 className="text-xs font-semibold text-zinc-400 mb-3">Altyapı Bilgileri</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                        <label className={labelClass()}>Hosting</label>
                        <input className={inputClass()} placeholder="Örn. Hetzner, Cloudways"
                               value={infraForm.hostingProvider}
                               onChange={e => updateInfra('hostingProvider', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass()}>Domain Bitiş</label>
                        <input type="date" className={inputClass()}
                               value={infraForm.domainExpiry}
                               onChange={e => updateInfra('domainExpiry', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass()}>SSL Bitiş</label>
                        <input type="date" className={inputClass()}
                               value={infraForm.sslExpiry}
                               onChange={e => updateInfra('sslExpiry', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass()}>CMS</label>
                        <input className={inputClass()} placeholder="Örn. WordPress"
                               value={infraForm.cmsType}
                               onChange={e => updateInfra('cmsType', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass()}>CMS Versiyonu</label>
                        <input className={inputClass()} placeholder="Örn. 6.4"
                               value={infraForm.cmsVersion}
                               onChange={e => updateInfra('cmsVersion', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass()}>Tema</label>
                        <input className={inputClass()} placeholder="Örn. Astra Pro"
                               value={infraForm.themeName}
                               onChange={e => updateInfra('themeName', e.target.value)} />
                    </div>
                </div>
                <div className="flex justify-end mt-3">
                    <button
                        onClick={() => saveInfra.mutate()}
                        disabled={!infraDirty || saveInfra.isPending}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#C8697A] text-white text-sm font-medium hover:bg-[#B85B6E] disabled:opacity-40 transition-colors"
                    >
                        {saveInfra.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saveInfra.isPending ? 'Kaydediliyor' : 'Altyapıyı Kaydet'}
                    </button>
                </div>
            </div>

            <div className="border-t border-white/[0.04]" />

            {/* Maintenance log */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-zinc-400">Bakım Günlüğü ({log.length})</h4>
                    {!showForm && (
                        <button
                            onClick={() => { setShowForm(true); setEditingId(null); setLogForm(emptyLogForm()); setPerformedAtLocal(todayIsoLocal()); }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#C8697A]/10 text-[#F5BEC8] text-xs font-medium hover:bg-[#C8697A]/20 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Kayıt Ekle
                        </button>
                    )}
                </div>

                {showForm && (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                                <label className={labelClass()}>Başlık</label>
                                <input className={inputClass()} placeholder="Örn. SSL sertifikası yenilendi"
                                       value={logForm.title}
                                       onChange={e => setLogForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelClass()}>Kategori</label>
                                <select className={inputClass()} value={logForm.category}
                                        onChange={e => setLogForm(p => ({ ...p, category: e.target.value }))}>
                                    {CATEGORY_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass()}>Tarih</label>
                                <input type="datetime-local" className={inputClass()}
                                       value={performedAtLocal}
                                       onChange={e => setPerformedAtLocal(e.target.value)} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className={labelClass()}>Açıklama</label>
                                <textarea className={`${inputClass()} min-h-[80px]`}
                                          placeholder="Yapılan işlemin detayları"
                                          value={logForm.description ?? ''}
                                          onChange={e => setLogForm(p => ({ ...p, description: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={resetForm}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-3.5 h-3.5" /> İptal
                            </button>
                            <button
                                onClick={submitLog}
                                disabled={!logForm.title.trim() || createLog.isPending || updateLog.isPending}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#C8697A] text-white text-xs font-medium hover:bg-[#B85B6E] disabled:opacity-40 transition-colors"
                            >
                                {(createLog.isPending || updateLog.isPending)
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Save className="w-3.5 h-3.5" />}
                                {editingId ? 'Güncelle' : 'Ekle'}
                            </button>
                        </div>
                    </div>
                )}

                {logLoading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                    </div>
                ) : log.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-6">Henüz bakım kaydı yok.</p>
                ) : (
                    <div className="space-y-2">
                        {log.map(entry => {
                            const date = new Date(entry.performedAt);
                            const categoryLabel = CATEGORY_OPTIONS.find(o => o.value === entry.category)?.label ?? entry.category;
                            return (
                                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                                            <h5 className="text-sm font-semibold text-white">{entry.title}</h5>
                                            <span className="text-[11px] text-zinc-500">
                                                {date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400">
                                                {categoryLabel}
                                            </span>
                                            {entry.performedByName && (
                                                <span className="text-[11px] text-zinc-500">{entry.performedByName}</span>
                                            )}
                                        </div>
                                        {entry.description && (
                                            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{entry.description}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => startEdit(entry)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                            title="Düzenle"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Bu bakım kaydı silinsin mi?')) {
                                                    deleteLog.mutate(entry.id);
                                                }
                                            }}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
