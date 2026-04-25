import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../../api/clientPanel';
import type { SurveyResponse } from '../../api/clientPanel';
import { Star, Send, MessageSquareText, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SurveyPage() {
    const queryClient = useQueryClient();
    const [score, setScore] = useState(0);
    const [hoverScore, setHoverScore] = useState(0);
    const [comment, setComment] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const { data: surveys = [], isLoading } = useQuery<SurveyResponse[]>({
        queryKey: ['my-surveys'],
        queryFn: () => clientApi.getMySurveys(),
    });

    const submitMutation = useMutation({
        mutationFn: () => clientApi.submitSurvey({ score, comment: comment.trim() || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-surveys'] });
            setScore(0);
            setComment('');
            setSuccessMsg('Anketiniz başarıyla gönderildi!');
            setTimeout(() => setSuccessMsg(''), 4000);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.response?.data || 'Anket gönderilemedi';
            setErrorMsg(typeof msg === 'string' ? msg : 'Anket gönderilemedi');
            setTimeout(() => setErrorMsg(''), 4000);
        },
    });

    const currentMonth = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const alreadySubmitted = surveys.some(s => {
        const d = new Date(s.surveyMonth);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const scoreLabel = (s: number) => {
        if (s <= 2) return 'Çok Kötü';
        if (s <= 4) return 'Kötü';
        if (s <= 6) return 'Orta';
        if (s <= 8) return 'İyi';
        return 'Mükemmel';
    };

    const scoreColor = (s: number) => {
        if (s <= 2) return 'text-red-400';
        if (s <= 4) return 'text-orange-400';
        if (s <= 6) return 'text-yellow-400';
        if (s <= 8) return 'text-[#F5BEC8]';
        return 'text-pink-400';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Memnuniyet Anketi</h1>
                <p className="text-sm text-zinc-500 mt-1">Hizmetlerimizi değerlendirin — {currentMonth}</p>
            </div>

            {/* Submit Form */}
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Star className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Bu Ayki Değerlendirme</h3>
                </div>

                {alreadySubmitted ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                        <CheckCircle2 className="w-5 h-5 text-pink-400 shrink-0" />
                        <p className="text-sm text-pink-300">Bu ay için anketinizi zaten gönderdiniz. Teşekkürler!</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Star Rating */}
                        <div>
                            <label className="text-xs text-zinc-500 block mb-3">Puanınız (1-10)</label>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setScore(n)}
                                        onMouseEnter={() => setHoverScore(n)}
                                        onMouseLeave={() => setHoverScore(0)}
                                        className="p-1 transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-7 h-7 transition-colors ${n <= (hoverScore || score)
                                                    ? 'text-orange-400 fill-orange-400'
                                                    : 'text-zinc-700'
                                                }`}
                                        />
                                    </button>
                                ))}
                                {(hoverScore || score) > 0 && (
                                    <span className={`ml-3 text-sm font-medium ${scoreColor(hoverScore || score)}`}>
                                        {scoreLabel(hoverScore || score)} ({hoverScore || score}/10)
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="text-xs text-zinc-500 block mb-1">
                                <MessageSquareText className="w-3 h-3 inline mr-1" />
                                Yorumunuz (isteğe bağlı)
                            </label>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                rows={3}
                                placeholder="Hizmetlerimiz hakkında düşünceleriniz..."
                                className="w-full bg-[#18181b]/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/30 resize-none"
                            />
                        </div>

                        {/* Messages */}
                        <AnimatePresence>
                            {successMsg && (
                                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 text-sm">
                                    <CheckCircle2 className="w-4 h-4" /> {successMsg}
                                </motion.div>
                            )}
                            {errorMsg && (
                                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                                    <AlertCircle className="w-4 h-4" /> {errorMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => submitMutation.mutate()}
                                disabled={score === 0 || submitMutation.isPending}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                {submitMutation.isPending ? 'Gönderiliyor...' : 'Anketi Gönder'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Past Surveys */}
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-[#F5BEC8]" />
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Geçmiş Değerlendirmelerim</h3>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="h-6 w-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                ) : surveys.length === 0 ? (
                    <p className="text-sm text-zinc-600 text-center py-6">Henüz anket göndermediniz.</p>
                ) : (
                    <div className="space-y-2">
                        {surveys.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[#18181b]/40 border border-white/[0.04]">
                                <div className="flex items-center gap-3">
                                    <div className={`text-lg font-bold ${scoreColor(s.score)}`}>{s.score}/10</div>
                                    <div>
                                        <p className="text-sm text-white">
                                            {new Date(s.surveyMonth).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-zinc-600">{scoreLabel(s.score)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 10 }, (_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 ${i < s.score ? 'text-orange-400 fill-orange-400' : 'text-zinc-800'}`} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
