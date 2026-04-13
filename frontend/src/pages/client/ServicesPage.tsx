import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

const services = [
    { id: 'social', name: 'Sosyal Medya Yönetimi', desc: 'Aylık içerik planı ve yönetimi', icon: '📱' },
    { id: 'seo', name: 'SEO Optimizasyonu', desc: 'Arama motoru optimizasyonu', icon: '🔍' },
    { id: 'ads', name: 'Google Ads Yönetimi', desc: 'Reklam kampanyası yönetimi', icon: '📊' },
    { id: 'content', name: 'İçerik Üretimi', desc: 'Blog, makale ve görsel içerik', icon: '✍️' },
    { id: 'video', name: 'Video Prodüksiyon', desc: 'Tanıtım ve sosyal medya videoları', icon: '🎬' },
    { id: 'design', name: 'Grafik Tasarım', desc: 'Logo, kurumsal kimlik, broşür', icon: '🎨' },
    { id: 'pr', name: 'PR & Halkla İlişkiler', desc: 'Basın bülteni, medya ilişkileri', icon: '📰' },
    { id: 'web', name: 'Web Geliştirme', desc: 'Web sitesi tasarım ve geliştirme', icon: '🌐' },
];

export default function ServicesPage() {
    const [selected, setSelected] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [submitted, setSubmitted] = useState(false);

    if (submitted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-pink-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Talebiniz Alındı!</h2>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                        Ek hizmet talebiniz ajans ekibine iletildi. En kısa sürede sizinle iletişime geçilecektir.
                    </p>
                    <button onClick={() => { setSubmitted(false); setSelected([]); setNote(''); }}
                        className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors">
                        Yeni Talep
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Ek Hizmet Al</h1>
                <p className="text-sm text-zinc-500 mt-1">İhtiyacınız olan hizmetleri seçin</p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {services.map((service) => {
                    const isSelected = selected.includes(service.id);
                    return (
                        <button key={service.id}
                            onClick={() => setSelected(prev =>
                                isSelected ? prev.filter(s => s !== service.id) : [...prev, service.id]
                            )}
                            className={`text-left p-4 rounded-xl border transition-all ${isSelected
                                ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
                                : 'bg-[#0C0C0E] border-white/[0.06] hover:bg-white/[0.02]'
                                }`}>
                            <span className="text-2xl">{service.icon}</span>
                            <h3 className={`text-sm font-semibold mt-2 ${isSelected ? 'text-blue-300' : 'text-white'}`}>{service.name}</h3>
                            <p className="text-xs text-zinc-500 mt-1">{service.desc}</p>
                        </button>
                    );
                })}
            </div>

            {/* Note */}
            {selected.length > 0 && (
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Ek notlarınız veya detaylar..."
                        rows={3}
                        className="w-full bg-[#18181b]/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-blue-500/30"
                    />
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">{selected.length} hizmet seçildi</p>
                        <button onClick={() => setSubmitted(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                            <Send className="w-4 h-4" />
                            Talep Gönder
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
