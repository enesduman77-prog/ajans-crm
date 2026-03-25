import { FolderOpen } from 'lucide-react';

export default function MediaLibraryPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Medya Kütüphanesi</h1>
                    <p className="text-sm text-zinc-500 mt-1">Paylaşılan görseller ve videolar</p>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-12">
                <div className="text-center space-y-4">
                    <div className="h-20 w-20 rounded-2xl bg-[#18181b] flex items-center justify-center mx-auto">
                        <FolderOpen className="w-10 h-10 text-zinc-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Henüz medya yok</h3>
                        <p className="text-sm text-zinc-500 mt-1">
                            Ajans ekibiniz medya dosyalarını paylaştığında burada görüntülenecek
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
