import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, ListTodo, Users, Camera, Rocket, MessageSquare, Trash2 } from 'lucide-react';
import { staffApi } from '../api/staff';
import { messagingApi } from '../api/messaging';
import type { AssignableUser } from '../api/staff';
import type { CompanyResponse } from '../api/admin';
import { useNavigate } from 'react-router-dom';

type ActionType = 'task' | 'meeting' | 'shoot' | 'project' | 'message';

const ACTIONS: { type: ActionType; icon: React.ReactNode; label: string; color: string; bg: string }[] = [
    { type: 'task', icon: <ListTodo className="w-5 h-5" />, label: 'Görev', color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20' },
    { type: 'meeting', icon: <Users className="w-5 h-5" />, label: 'Toplantı', color: 'text-cyan-400', bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20' },
    { type: 'shoot', icon: <Camera className="w-5 h-5" />, label: 'Çekim', color: 'text-blue-400', bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' },
    { type: 'project', icon: <Rocket className="w-5 h-5" />, label: 'Proje', color: 'text-pink-400', bg: 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20' },
    { type: 'message', icon: <MessageSquare className="w-5 h-5" />, label: 'Mesaj', color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' },
];

const categoryLabels: Record<string, string> = {
    REELS: 'Reels', BLOG: 'Blog', PAYLASIM: 'Paylaşım', SEO: 'SEO',
    TASARIM: 'Tasarım', TOPLANTI: 'Toplantı', OTHER: 'Diğer',
};

const inputCls = "w-full mt-1 px-4 py-2.5 bg-[#18181b]/60 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-colors";
const labelCls = "text-[10px] font-bold text-zinc-500 uppercase tracking-widest";

export default function FloatingTaskFab() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [action, setAction] = useState<ActionType | null>(null);
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [users, setUsers] = useState<AssignableUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [companyId, setCompanyId] = useState<string>('');

    useEffect(() => {
        if (menuOpen || action) {
            staffApi.getCompanies().then(setCompanies).catch(() => {});
            staffApi.getAssignableUsers(companyId || undefined).then(setUsers).catch(() => {});
        }
    }, [menuOpen, action, companyId]);

    const closeAll = () => { setMenuOpen(false); setAction(null); setCompanyId(''); };
    const openForm = (t: ActionType) => { setMenuOpen(false); setAction(t); };

    return (
        <>
            {/* FAB Button */}
            <button onClick={() => setMenuOpen(o => !o)}
                className={`fixed bottom-8 right-8 h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 group`}>
                <Plus className={`w-6 h-6 transition-transform duration-300 ${menuOpen ? 'rotate-45' : 'group-hover:rotate-90'}`} />
            </button>

            {/* Quick Action Popup — bottom-right above FAB */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                            className="fixed bottom-24 right-8 z-50 w-52 bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
                        >
                            <div className="p-2 space-y-0.5">
                                {ACTIONS.map((a, i) => (
                                    <motion.button
                                        key={a.type}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => openForm(a.type)}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                                    >
                                        <div className={a.color}>{a.icon}</div>
                                        <span className="text-sm font-medium text-white">{a.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Form Modal */}
            <AnimatePresence>
                {action && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={closeAll}>
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                                <h3 className="text-lg font-bold text-white">
                                    Yeni {ACTIONS.find(a => a.type === action)?.label}
                                </h3>
                                <button onClick={closeAll} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5">
                                {action === 'task' && <TaskForm companies={companies} users={users} companyId={companyId} setCompanyId={setCompanyId} loading={loading} setLoading={setLoading} onDone={closeAll} />}
                                {action === 'meeting' && <MeetingForm companies={companies} users={users} companyId={companyId} setCompanyId={setCompanyId} loading={loading} setLoading={setLoading} onDone={closeAll} />}
                                {action === 'shoot' && <ShootForm companies={companies} users={users} companyId={companyId} setCompanyId={setCompanyId} loading={loading} setLoading={setLoading} onDone={closeAll} />}
                                {action === 'project' && <ProjectForm companies={companies} users={users} companyId={companyId} setCompanyId={setCompanyId} loading={loading} setLoading={setLoading} onDone={closeAll} />}
                                {action === 'message' && <MessageForm users={users} loading={loading} setLoading={setLoading} onDone={closeAll} navigate={navigate} />}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ─── Shared ─── */
interface FormProps {
    companies: CompanyResponse[];
    users: AssignableUser[];
    companyId: string;
    setCompanyId: (v: string) => void;
    loading: boolean;
    setLoading: (v: boolean) => void;
    onDone: () => void;
}

function CompanySelect({ companies, companyId, setCompanyId, required = false }: { companies: CompanyResponse[]; companyId: string; setCompanyId: (v: string) => void; required?: boolean }) {
    return (
        <div>
            <label className={labelCls}>Şirket {required && '*'}</label>
            <select value={companyId} onChange={e => setCompanyId(e.target.value)} className={inputCls} required={required}>
                <option value="">Ajans İçi (Şirketsiz)</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>
    );
}

function UserSelect({ users, value, onChange, label = 'Atanan Kişi *', required = true }: { users: AssignableUser[]; value: string; onChange: (v: string) => void; label?: string; required?: boolean }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)} className={inputCls} required={required}>
                <option value="">Kişi seçiniz</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.globalRole === 'ADMIN' ? 'Admin' : u.globalRole === 'AGENCY_STAFF' ? 'Ajans' : 'Müşteri'})</option>
                ))}
            </select>
        </div>
    );
}

function SubmitBtn({ loading, label, color = 'bg-emerald-600 hover:bg-emerald-500' }: { loading: boolean; label: string; color?: string }) {
    return (
        <button type="submit" disabled={loading}
            className={`w-full py-3 ${color} text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50`}>
            {loading ? 'Oluşturuluyor...' : label}
        </button>
    );
}

/* ─── Task Form (full) ─── */
function TaskForm({ companies, users, companyId, setCompanyId, loading, setLoading, onDone }: FormProps) {
    const [f, setF] = useState({
        assignedToId: '', title: '', description: '', category: 'OTHER', priority: 'MEDIUM',
        startDate: '', startTime: '', endDate: '', endTime: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!f.assignedToId || !f.title) return;
        setLoading(true);
        try {
            await staffApi.createTask({
                ...f,
                companyId: companyId || undefined,
                startDate: f.startDate ? new Date(f.startDate).toISOString() : undefined,
                startTime: f.startTime || undefined,
                endDate: f.endDate ? new Date(f.endDate).toISOString() : undefined,
                endTime: f.endTime || undefined,
            });
            onDone();
            window.location.reload();
        } catch { /* */ }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelCls}>Görev Başlığı *</label>
                <input value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Görev başlığı..." required />
            </div>
            <UserSelect users={users} value={f.assignedToId} onChange={v => setF(p => ({ ...p, assignedToId: v }))} />
            <CompanySelect companies={companies} companyId={companyId} setCompanyId={setCompanyId} />
            <div>
                <label className={labelCls}>Açıklama</label>
                <textarea value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} className={`${inputCls} resize-none`} rows={3} placeholder="Görev detayları..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Kategori</label>
                    <select value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                        {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Öncelik</label>
                    <select value={f.priority} onChange={e => setF(p => ({ ...p, priority: e.target.value }))} className={inputCls}>
                        <option value="LOW">Düşük</option>
                        <option value="MEDIUM">Orta</option>
                        <option value="HIGH">Yüksek</option>
                        <option value="URGENT">Acil</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Başlangıç Tarihi</label>
                    <input type="date" value={f.startDate} onChange={e => setF(p => ({ ...p, startDate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Başlangıç Saati</label>
                    <input type="time" value={f.startTime} onChange={e => setF(p => ({ ...p, startTime: e.target.value }))} className={inputCls} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Bitiş Tarihi</label>
                    <input type="date" value={f.endDate} onChange={e => setF(p => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Bitiş Saati</label>
                    <input type="time" value={f.endTime} onChange={e => setF(p => ({ ...p, endTime: e.target.value }))} className={inputCls} />
                </div>
            </div>
            <SubmitBtn loading={loading} label="Görev Oluştur" />
        </form>
    );
}

/* ─── Meeting Form ─── */
function MeetingForm({ companies, users, companyId, setCompanyId, loading, setLoading, onDone }: FormProps) {
    const [f, setF] = useState({ title: '', description: '', meetingDate: '', location: '', durationMinutes: 60, participantIds: [] as string[] });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!f.title || !f.meetingDate) return;
        setLoading(true);
        try {
            await staffApi.createMeeting({
                companyId: companyId || undefined,
                title: f.title,
                description: f.description || undefined,
                meetingDate: f.meetingDate ? new Date(f.meetingDate).toISOString() : '',
                location: f.location || undefined,
                durationMinutes: f.durationMinutes || undefined,
                participantIds: f.participantIds.length ? f.participantIds : undefined,
            });
            onDone();
            window.location.reload();
        } catch { /* */ }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <CompanySelect companies={companies} companyId={companyId} setCompanyId={setCompanyId} />
            <div>
                <label className={labelCls}>Başlık *</label>
                <input value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Toplantı konusu..." required />
            </div>
            <div>
                <label className={labelCls}>Açıklama</label>
                <textarea value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} className={`${inputCls} resize-none`} rows={2} placeholder="Toplantı detayları..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Tarih & Saat *</label>
                    <input type="datetime-local" value={f.meetingDate} onChange={e => setF(p => ({ ...p, meetingDate: e.target.value }))} className={inputCls} required />
                </div>
                <div>
                    <label className={labelCls}>Süre (dk)</label>
                    <input type="number" value={f.durationMinutes} onChange={e => setF(p => ({ ...p, durationMinutes: Number(e.target.value) }))} className={inputCls} min={15} step={15} />
                </div>
            </div>
            <div>
                <label className={labelCls}>Konum</label>
                <input value={f.location} onChange={e => setF(p => ({ ...p, location: e.target.value }))} className={inputCls} placeholder="Ofis, Zoom, vb..." />
            </div>
            <div>
                <label className={labelCls}>Katılımcılar</label>
                <select multiple value={f.participantIds} onChange={e => setF(p => ({ ...p, participantIds: Array.from(e.target.selectedOptions, o => o.value) }))}
                    className={`${inputCls} min-h-[80px]`}>
                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
                <p className="text-[10px] text-zinc-600 mt-1">Ctrl/Cmd ile çoklu seçim yapabilirsiniz</p>
            </div>
            <SubmitBtn loading={loading} label="Toplantı Oluştur" color="bg-cyan-600 hover:bg-cyan-500" />
        </form>
    );
}

/* ─── Shoot Form ─── */
interface EquipmentForm { name: string; quantity: number; notes: string }

function ShootForm({ companies, users, companyId, setCompanyId, loading, setLoading, onDone }: FormProps) {
    const [f, setF] = useState({
        title: '', description: '', shootDate: '', shootTime: '', location: '', photographerId: '', notes: '',
        equipment: [{ name: '', quantity: 1, notes: '' }] as EquipmentForm[],
    });

    const addEquipment = () => setF(p => ({ ...p, equipment: [...p.equipment, { name: '', quantity: 1, notes: '' }] }));
    const removeEquipment = (i: number) => setF(p => ({ ...p, equipment: p.equipment.filter((_, idx) => idx !== i) }));
    const updateEquipment = (i: number, field: keyof EquipmentForm, value: string | number) => {
        setF(p => ({ ...p, equipment: p.equipment.map((eq, idx) => idx === i ? { ...eq, [field]: value } : eq) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId || !f.title) return;
        setLoading(true);
        try {
            const validEquip = f.equipment.filter(eq => eq.name.trim());
            await staffApi.createShoot({
                companyId,
                title: f.title,
                description: f.description || undefined,
                shootDate: f.shootDate || undefined,
                shootTime: f.shootTime || undefined,
                location: f.location || undefined,
                photographerId: f.photographerId || undefined,
                notes: f.notes || undefined,
                equipment: validEquip.length ? validEquip : undefined,
            });
            onDone();
            window.location.reload();
        } catch { /* */ }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <CompanySelect companies={companies} companyId={companyId} setCompanyId={setCompanyId} required />
            {!companyId && <p className="text-xs text-amber-400">Çekim için şirket seçimi zorunludur.</p>}
            <div>
                <label className={labelCls}>Başlık *</label>
                <input value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Çekim başlığı..." required />
            </div>
            <UserSelect users={users} value={f.photographerId} onChange={v => setF(p => ({ ...p, photographerId: v }))} label="Çekimci" required={false} />
            <div>
                <label className={labelCls}>Açıklama</label>
                <textarea value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} className={`${inputCls} resize-none`} rows={2} placeholder="Çekim detayları..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Çekim Tarihi</label>
                    <input type="date" value={f.shootDate} onChange={e => setF(p => ({ ...p, shootDate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Saat</label>
                    <input type="time" value={f.shootTime} onChange={e => setF(p => ({ ...p, shootTime: e.target.value }))} className={inputCls} />
                </div>
            </div>
            <div>
                <label className={labelCls}>Konum</label>
                <input value={f.location} onChange={e => setF(p => ({ ...p, location: e.target.value }))} className={inputCls} placeholder="Çekim yeri..." />
            </div>
            <div>
                <label className={labelCls}>Notlar</label>
                <textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} className={`${inputCls} resize-none`} rows={2} placeholder="Çekim notları..." />
            </div>

            {/* Equipment */}
            <div className="border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between mb-3">
                    <label className={labelCls}>Ekipman Listesi</label>
                    <button type="button" onClick={addEquipment} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold">+ Ekle</button>
                </div>
                <div className="space-y-2">
                    {f.equipment.map((eq, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input value={eq.name} onChange={e => updateEquipment(i, 'name', e.target.value)}
                                className="flex-1 px-3 py-2 bg-[#18181b]/60 border border-white/[0.06] rounded-lg text-sm text-white outline-none focus:border-emerald-500/50"
                                placeholder="Ekipman adı" />
                            <input type="number" value={eq.quantity} onChange={e => updateEquipment(i, 'quantity', Number(e.target.value))}
                                className="w-16 px-2 py-2 bg-[#18181b]/60 border border-white/[0.06] rounded-lg text-sm text-white outline-none text-center" min={1} />
                            <input value={eq.notes} onChange={e => updateEquipment(i, 'notes', e.target.value)}
                                className="flex-1 px-3 py-2 bg-[#18181b]/60 border border-white/[0.06] rounded-lg text-sm text-white outline-none focus:border-emerald-500/50"
                                placeholder="Not" />
                            {f.equipment.length > 1 && (
                                <button type="button" onClick={() => removeEquipment(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <SubmitBtn loading={loading} label="Çekim Oluştur" color="bg-blue-600 hover:bg-blue-500" />
        </form>
    );
}

/* ─── Project Form ─── */
interface PhaseForm { name: string; assignedToId: string; startDate: string; endDate: string; notes: string }
const emptyPhase = (n: number): PhaseForm => ({ name: `Faz ${n}`, assignedToId: '', startDate: '', endDate: '', notes: '' });

function ProjectForm({ companies, users, companyId, setCompanyId, loading, setLoading, onDone }: FormProps) {
    const [f, setF] = useState({
        name: '', responsibleId: '', purpose: '', startDate: '', endDate: '', notes: '',
        phases: [emptyPhase(1), emptyPhase(2), emptyPhase(3)] as PhaseForm[],
    });

    const addPhase = () => setF(p => ({ ...p, phases: [...p.phases, emptyPhase(p.phases.length + 1)] }));
    const removePhase = (i: number) => setF(p => ({ ...p, phases: p.phases.filter((_, idx) => idx !== i) }));
    const updatePhase = (i: number, field: keyof PhaseForm, value: string) => {
        setF(p => ({ ...p, phases: p.phases.map((ph, idx) => idx === i ? { ...ph, [field]: value } : ph) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!f.name) return;
        setLoading(true);
        try {
            const validPhases = f.phases.filter(ph => ph.name.trim()).map(ph => ({
                name: ph.name,
                assignedToId: ph.assignedToId || undefined,
                startDate: ph.startDate || undefined,
                endDate: ph.endDate || undefined,
                notes: ph.notes || undefined,
            }));
            await staffApi.createPrProject({
                name: f.name,
                companyId: companyId || undefined,
                responsibleId: f.responsibleId || undefined,
                purpose: f.purpose || undefined,
                startDate: f.startDate ? new Date(f.startDate).toISOString() : undefined,
                endDate: f.endDate ? new Date(f.endDate).toISOString() : undefined,
                notes: f.notes || undefined,
                totalPhases: f.phases.length,
                phases: validPhases.length ? validPhases : undefined,
            });
            onDone();
            window.location.reload();
        } catch { /* */ }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <CompanySelect companies={companies} companyId={companyId} setCompanyId={setCompanyId} />
            <div>
                <label className={labelCls}>Proje Adı *</label>
                <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Proje adı..." required />
            </div>
            <UserSelect users={users} value={f.responsibleId} onChange={v => setF(p => ({ ...p, responsibleId: v }))} label="Sorumlu Kişi" required={false} />
            <div>
                <label className={labelCls}>Amaç / Açıklama</label>
                <textarea value={f.purpose} onChange={e => setF(p => ({ ...p, purpose: e.target.value }))} className={`${inputCls} resize-none`} rows={2} placeholder="Projenin amacı..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Başlangıç Tarihi</label>
                    <input type="date" value={f.startDate} onChange={e => setF(p => ({ ...p, startDate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Bitiş Tarihi</label>
                    <input type="date" value={f.endDate} onChange={e => setF(p => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                </div>
            </div>
            <div>
                <label className={labelCls}>Notlar</label>
                <textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} className={`${inputCls} resize-none`} rows={2} placeholder="Proje notları..." />
            </div>

            {/* Phases */}
            <div className="border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between mb-3">
                    <label className={labelCls}>Proje Fazları ({f.phases.length})</label>
                    <button type="button" onClick={addPhase} className="text-[10px] text-pink-400 hover:text-pink-300 font-bold">+ Faz Ekle</button>
                </div>
                <div className="space-y-3">
                    {f.phases.map((ph, i) => (
                        <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-400">Faz {i + 1}</span>
                                {f.phases.length > 1 && (
                                    <button type="button" onClick={() => removePhase(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <input value={ph.name} onChange={e => updatePhase(i, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-[#18181b]/60 border border-white/[0.06] rounded-lg text-sm text-white outline-none focus:border-pink-500/50"
                                placeholder="Faz adı" />
                            <select value={ph.assignedToId} onChange={e => updatePhase(i, 'assignedToId', e.target.value)}
                                className="w-full px-3 py-2 bg-[#18181b]/60 border border-white/[0.06] rounded-lg text-sm text-white outline-none">
                                <option value="">Sorumlu seçiniz</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="date" value={ph.startDate} onChange={e => updatePhase(i, 'startDate', e.target.value)}
                                    className="px-3 py-2 bg-[#18181b]/60 border border-white/[0.06] rounded-lg text-sm text-white outline-none" />
                                <input type="date" value={ph.endDate} onChange={e => updatePhase(i, 'endDate', e.target.value)}
                                    className="px-3 py-2 bg-[#18181b]/60 border border-white/[0.06] rounded-lg text-sm text-white outline-none" />
                            </div>
                            <textarea value={ph.notes} onChange={e => updatePhase(i, 'notes', e.target.value)}
                                className="w-full px-3 py-2 bg-[#18181b]/60 border border-white/[0.06] rounded-lg text-sm text-white outline-none resize-none"
                                rows={1} placeholder="Faz notu..." />
                        </div>
                    ))}
                </div>
            </div>
            <SubmitBtn loading={loading} label="Proje Oluştur" color="bg-pink-600 hover:bg-pink-500" />
        </form>
    );
}

/* ─── Message Form ─── */
function MessageForm({ users, loading, setLoading, onDone, navigate }: { users: AssignableUser[]; loading: boolean; setLoading: (v: boolean) => void; onDone: () => void; navigate: ReturnType<typeof useNavigate> }) {
    const [targetUserId, setTargetUserId] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUserId || !message.trim()) return;
        setLoading(true);
        try {
            const conv = await messagingApi.startConversation(targetUserId);
            await messagingApi.sendMessage(conv.id, { content: message.trim() });
            onDone();
            navigate('/staff/messages');
        } catch { /* */ }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <UserSelect users={users} value={targetUserId} onChange={setTargetUserId} label="Kime *" />
            <div>
                <label className={labelCls}>Mesaj *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Mesajınızı yazın..." required />
            </div>
            <SubmitBtn loading={loading} label="Mesaj Gönder" color="bg-amber-600 hover:bg-amber-500" />
        </form>
    );
}
