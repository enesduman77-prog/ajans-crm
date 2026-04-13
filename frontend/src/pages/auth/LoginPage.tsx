import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, User, Zap, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            setTimeout(() => navigate('/'), 600);
        } catch (err: any) {
            const status = err?.response?.status;
            if (!err?.response) {
                setError('Sunucuya ulasilamiyor. Lutfen birkac saniye sonra tekrar deneyin.');
            } else if (status === 429) {
                setError('Cok fazla deneme yapildi. Lutfen biraz bekleyip tekrar deneyin.');
            } else if (status === 401) {
                setError('Gecersiz email veya sifre.');
            } else if (status >= 500) {
                setError('Sunucu gecici olarak hazir degil. Lutfen tekrar deneyin.');
            } else {
                setError(err.response?.data?.message || 'Erisim reddedildi. Bilgilerinizi dogrulayin.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-[#09090b] dark-gradient flex items-center justify-center p-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-pink-500/5 rounded-full blur-[120px]" />

            <AnimatePresence>
                {isReady && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-[400px] space-y-8 relative"
                    >
                        <div className="text-center space-y-3">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center justify-center"
                            >
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-pink-500/25 mb-2">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                            </motion.div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                <h1 className="text-2xl font-bold tracking-tight text-white">
                                    FOG<span className="text-zinc-500 font-normal">istanbul</span>
                                </h1>
                                <p className="text-zinc-600 text-xs mt-1">Dijital Ajans Yonetim Sistemi</p>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-[#0C0C0E] border border-white/[0.06] p-7 rounded-2xl"
                        >
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-white">Giris Yap</h2>
                                <p className="text-zinc-500 text-[13px] mt-0.5">Hesabiniza erismek icin bilgilerinizi girin.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2.5"
                                        >
                                            <AlertTriangle className="w-4 h-4 shrink-0" />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-zinc-400 ml-0.5">E-Posta</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-pink-400 transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[13px] text-white outline-none focus:border-pink-500/30 focus:bg-white/[0.05] transition-all placeholder:text-zinc-700"
                                            placeholder="admin@fogistanbul.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-zinc-400 ml-0.5">Sifre</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-pink-400 transition-colors" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[13px] text-white outline-none focus:border-pink-500/30 focus:bg-white/[0.05] transition-all placeholder:text-zinc-700"
                                            placeholder="********"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-1 px-0.5">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" className="peer appearance-none w-4 h-4 border border-white/10 rounded bg-white/[0.03] checked:bg-pink-500 checked:border-pink-500 transition-all" />
                                            <User className="absolute w-2.5 h-2.5 left-[3px] text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-zinc-500 text-[11px] group-hover:text-zinc-400 transition-colors">Beni Hatirla</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-amber-600 hover:from-pink-600 hover:to-amber-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-[13px] transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Giris Yap</span>
                                            <LogIn className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>

                        <p className="text-center text-zinc-800 text-[10px]">&copy; 2025 FOGistanbul</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
