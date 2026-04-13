import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const current = i18n.language?.startsWith('en') ? 'en' : 'tr';

    const toggle = () => {
        i18n.changeLanguage(current === 'tr' ? 'en' : 'tr');
    };

    return (
        <button
            onClick={toggle}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-colors text-[11px] font-medium"
            title={current === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
        >
            <Languages className="w-3.5 h-3.5" />
            {current.toUpperCase()}
        </button>
    );
}
