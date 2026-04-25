import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, ArrowLeft, Sparkles, Building2, Users, Settings, Rocket } from 'lucide-react';

const steps = [
    {
        id: 'welcome',
        title: 'FOG İstanbul\'a Hoş Geldiniz!',
        description: 'Size en iyi hizmeti sunabilmemiz için birkaç adımda bilgilerinizi tamamlayalım.',
        icon: Sparkles,
        color: 'text-orange-400',
    },
    {
        id: 'company',
        title: 'Şirket Bilgileri',
        description: 'Şirketiniz hakkında temel bilgileri gözden geçirin.',
        icon: Building2,
        color: 'text-[#F5BEC8]',
    },
    {
        id: 'team',
        title: 'Ekibinizi Tanıyın',
        description: 'Size atanmış ekip üyelerimizi tanıyın.',
        icon: Users,
        color: 'text-pink-400',
    },
    {
        id: 'preferences',
        title: 'Tercihleriniz',
        description: 'Bildirim ve iletişim tercihlerinizi ayarlayın.',
        icon: Settings,
        color: 'text-purple-400',
    },
    {
        id: 'done',
        title: 'Hazırsınız!',
        description: 'Artık paneli kullanmaya başlayabilirsiniz.',
        icon: Rocket,
        color: 'text-orange-400',
    },
];

export default function OnboardingPage() {
    const [current, setCurrent] = useState(0);
    const [completed, setCompleted] = useState<Set<number>>(new Set());

    const step = steps[current];
    const isLast = current === steps.length - 1;
    const isFirst = current === 0;

    const next = () => {
        setCompleted(prev => new Set(prev).add(current));
        if (!isLast) setCurrent(c => c + 1);
    };

    const prev = () => {
        if (!isFirst) setCurrent(c => c - 1);
    };

    const StepIcon = step.icon;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
            {/* Progress Bar */}
            <div className="w-full max-w-md mb-12">
                <div className="flex items-center justify-between mb-2">
                    {steps.map((s, i) => {
                        const Icon = s.icon;
                        const isDone = completed.has(i);
                        const isCurrent = i === current;
                        return (
                            <div key={s.id} className="flex items-center">
                                <button
                                    onClick={() => setCurrent(i)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone
                                            ? 'bg-pink-500 border-pink-500'
                                            : isCurrent
                                                ? 'border-orange-500 bg-orange-500/10'
                                                : 'border-white/[0.1] bg-white/[0.02]'
                                        }`}
                                >
                                    {isDone ? (
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    ) : (
                                        <Icon className={`w-4 h-4 ${isCurrent ? s.color : 'text-zinc-600'}`} />
                                    )}
                                </button>
                                {i < steps.length - 1 && (
                                    <div className={`w-8 sm:w-12 h-0.5 mx-1 ${isDone ? 'bg-pink-500' : 'bg-white/[0.06]'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-lg text-center"
                >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-white/[0.04] border border-white/[0.06]`}>
                        <StepIcon className={`w-8 h-8 ${step.color}`} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-sm text-zinc-500 mb-8">{step.description}</p>

                    {/* Step-specific content */}
                    {step.id === 'welcome' && (
                        <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-left space-y-3">
                            <p className="text-[13px] text-zinc-400">Bu rehber sizi aşağıdaki konularda yönlendirecek:</p>
                            <ul className="space-y-2 text-[13px] text-zinc-300">
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-pink-400" /> Şirket bilgilerinizi doğrulama</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-pink-400" /> Ekibinizi tanıma</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-pink-400" /> Bildirim tercihlerini ayarlama</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-pink-400" /> Panel kullanımına başlama</li>
                            </ul>
                        </div>
                    )}

                    {step.id === 'company' && (
                        <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-left space-y-4">
                            <p className="text-[13px] text-zinc-400">
                                Şirket bilgileriniz kayıt sırasında ekibimiz tarafından oluşturulmuştur.
                                Herhangi bir değişiklik için lütfen hesap yöneticinizle iletişime geçin.
                            </p>
                            <div className="p-3 bg-[#C8697A]/5 border border-[#C8697A]/20 rounded-xl">
                                <p className="text-[12px] text-[#F5BEC8]">
                                    💡 Şirket bilgilerinizi sol menüdeki "Ayarlar" sayfasından görüntüleyebilirsiniz.
                                </p>
                            </div>
                        </div>
                    )}

                    {step.id === 'team' && (
                        <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-left space-y-4">
                            <p className="text-[13px] text-zinc-400">
                                Size atanmış ekip üyelerimiz görevlerinizi yönetir, toplantılarınızı planlar
                                ve içerik üretimi süreçlerinizde size destek olur.
                            </p>
                            <div className="p-3 bg-pink-500/5 border border-pink-500/10 rounded-xl">
                                <p className="text-[12px] text-pink-400">
                                    💡 Mesajlaşma bölümünden ekip üyelerinizle doğrudan iletişim kurabilirsiniz.
                                </p>
                            </div>
                        </div>
                    )}

                    {step.id === 'preferences' && (
                        <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-left space-y-4">
                            <p className="text-[13px] text-zinc-400">
                                Bildirim tercihlerinizi "Ayarlar" sayfasından istediğiniz zaman güncelleyebilirsiniz.
                            </p>
                            <div className="space-y-2">
                                {[
                                    { label: 'Görev bildirimleri', desc: 'Yeni görevler ve güncellemeler' },
                                    { label: 'Mesaj bildirimleri', desc: 'Yeni mesaj geldiğinde' },
                                    { label: 'Toplantı hatırlatmaları', desc: 'Yaklaşan toplantılar' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                                        <div>
                                            <p className="text-[13px] text-white">{item.label}</p>
                                            <p className="text-[10px] text-zinc-600">{item.desc}</p>
                                        </div>
                                        <div className="w-8 h-5 bg-pink-500 rounded-full relative">
                                            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step.id === 'done' && (
                        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl text-left space-y-4">
                            <p className="text-[13px] text-zinc-300">
                                🎉 Tebrikler! Artık FOG İstanbul Panel'ini tam kapasite kullanmaya hazırsınız.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Dashboard', desc: 'Genel bakış', href: '/client' },
                                    { label: 'Görevler', desc: 'Aktif görevleriniz', href: '/client/tasks' },
                                    { label: 'Mesajlar', desc: 'Ekiple iletişim', href: '/client/messaging' },
                                    { label: 'Medya', desc: 'Dosyalarınız', href: '/client/media' },
                                ].map(item => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-xl hover:border-orange-500/30 transition-colors"
                                    >
                                        <p className="text-[13px] text-white font-medium">{item.label}</p>
                                        <p className="text-[10px] text-zinc-600">{item.desc}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-8">
                {!isFirst && (
                    <button
                        onClick={prev}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white rounded-xl text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Geri
                    </button>
                )}
                {!isLast ? (
                    <button
                        onClick={next}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Devam
                        <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <a
                        href="/client"
                        className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Rocket className="w-4 h-4" />
                        Panele Git
                    </a>
                )}
            </div>
        </div>
    );
}
