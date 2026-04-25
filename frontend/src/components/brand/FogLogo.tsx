type FogLogoProps = {
    className?: string;
    variant?: 'full' | 'mark';
    tone?: 'red' | 'pink' | 'mono';
};

/**
 * FOG İstanbul kurumsal kimlik logosu.
 * - `full`: FOGistanbul wordmark (FOG kalın marka rengi + istanbul ince)
 * - `mark`: yalnızca FOG (ikon / amblem kullanımı)
 */
export default function FogLogo({ className, variant = 'full', tone = 'pink' }: FogLogoProps) {
    const markColor =
        tone === 'red' ? '#D1181C'
            : tone === 'mono' ? 'currentColor'
                : '#C8697A';

    return (
        <span
            className={`inline-flex items-baseline font-bold tracking-tight select-none ${className ?? ''}`}
            style={{ letterSpacing: '-0.02em' }}
            aria-label="FOG İstanbul"
        >
            <span style={{ color: markColor, fontWeight: 800 }}>FOG</span>
            {variant === 'full' && (
                <span className="font-light opacity-90" style={{ marginLeft: '0.08em' }}>
                    istanbul
                </span>
            )}
        </span>
    );
}
