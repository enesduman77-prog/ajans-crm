import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import { fileApi } from '../../api/features';
import type { FileAttachmentResponse } from '../../api/features';
import type { CompanyResponse } from '../../api/admin';
import FileUploader from '../../components/FileUploader';
import { FolderOpen, Image, Video, FileText, File, Trash2, Download, Eye, X, Upload, Filter, Building2, ArrowLeft, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FILTERS = [
    { key: '', label: 'Hepsi' },
    { key: 'image/', label: 'Görseller', icon: Image },
    { key: 'video/', label: 'Videolar', icon: Video },
    { key: 'application/', label: 'Belgeler', icon: FileText },
];

function getFileIcon(contentType: string | null) {
    if (!contentType) return File;
    if (contentType.startsWith('image/')) return Image;
    if (contentType.startsWith('video/')) return Video;
    return FileText;
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(d: string) {
    try {
        return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
}

export default function StaffMediaLibraryPage() {
    const queryClient = useQueryClient();

    const [selectedCompany, setSelectedCompany] = useState<CompanyResponse | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(0);
    const [showUpload, setShowUpload] = useState(false);
    const [preview, setPreview] = useState<FileAttachmentResponse | null>(null);

    const { data: companies } = useQuery({
        queryKey: ['staff-companies'],
        queryFn: () => staffApi.getCompanies(),
    });

    const { data: mediaCounts } = useQuery({
        queryKey: ['media-counts'],
        queryFn: () => fileApi.getCompanyMediaCounts(),
    });

    const { data: mediaData, isLoading: mediaLoading } = useQuery({
        queryKey: ['company-media', selectedCompany?.id, filter, page],
        queryFn: () => fileApi.getCompanyMedia(selectedCompany!.id, page, 24, filter || undefined),
        enabled: !!selectedCompany,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => fileApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-media'] });
            queryClient.invalidateQueries({ queryKey: ['media-counts'] });
        },
    });

    const filteredCompanies = (companies || []).filter(c =>
        !search || c.name.toLowerCase().includes(search.toLowerCase())
    );

    // Company list view
    if (!selectedCompany) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Medya Kütüphanesi</h1>
                    <p className="text-sm text-zinc-500 mt-1">Şirketlerin medya dosyalarını yönetin</p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Şirket ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0C0C0E] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30" />
                </div>

                {/* Company Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredCompanies.map(company => {
                        const count = mediaCounts?.[company.id] || 0;
                        return (
                            <button key={company.id}
                                onClick={() => { setSelectedCompany(company); setFilter(''); setPage(0); }}
                                className="text-left bg-[#0C0C0E] border border-white/[0.06] rounded-xl p-4 hover:border-orange-500/20 hover:bg-[#131315] transition-all group">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate group-hover:text-orange-400 transition-colors">{company.name}</p>
                                        <p className="text-[11px] text-zinc-600 mt-0.5">{company.industry || 'Sektör belirtilmemiş'}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <FolderOpen className="w-3 h-3 text-zinc-600" />
                                        <span className="text-[11px] text-zinc-500">{count} dosya</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {filteredCompanies.length === 0 && (
                    <div className="text-center py-12 text-zinc-600 text-sm">
                        {search ? 'Sonuç bulunamadı' : 'Henüz şirket yok'}
                    </div>
                )}
            </div>
        );
    }

    // Company media view
    const files = mediaData?.content || [];
    const totalPages = mediaData?.totalPages || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => { setSelectedCompany(null); setPreview(null); }}
                        className="p-2 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] transition-colors">
                        <ArrowLeft className="w-4 h-4 text-zinc-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{selectedCompany.name}</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Medya Kütüphanesi</p>
                    </div>
                </div>
                <button onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
                    <Upload className="w-4 h-4" /> Dosya Yükle
                </button>
            </div>

            {/* Upload Section */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-5">
                            <FileUploader entityType="COMPANY" entityId={selectedCompany.id}
                                onUploadComplete={() => {
                                    queryClient.invalidateQueries({ queryKey: ['company-media'] });
                                    queryClient.invalidateQueries({ queryKey: ['media-counts'] });
                                    setShowUpload(false);
                                }}
                                accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-600" />
                {FILTERS.map(f => (
                    <button key={f.key} onClick={() => { setFilter(f.key); setPage(0); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.key
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:text-zinc-300'}`}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {mediaLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-square bg-[#0C0C0E] rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : files.length === 0 ? (
                <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-2xl p-12">
                    <div className="text-center space-y-4">
                        <div className="h-20 w-20 rounded-2xl bg-[#18181b] flex items-center justify-center mx-auto">
                            <FolderOpen className="w-10 h-10 text-zinc-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Henüz medya yok</h3>
                            <p className="text-sm text-zinc-500 mt-1">Bu şirket için dosya yüklemek için yukarıdaki butonu kullanın</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {files.map(file => {
                        const Icon = getFileIcon(file.contentType);
                        const isImage = file.contentType?.startsWith('image/');
                        const isVideo = file.contentType?.startsWith('video/');
                        return (
                            <div key={file.id}
                                className="group relative bg-[#0C0C0E] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors">
                                <div className="aspect-square flex items-center justify-center bg-[#0a0a0b] cursor-pointer"
                                    onClick={() => (isImage || isVideo) ? setPreview(file) : window.open(fileApi.getDownloadUrl(file.id), '_blank')}>
                                    {isImage ? (
                                        <img src={fileApi.getDownloadUrl(file.id)} alt={file.originalName}
                                            className="w-full h-full object-cover" loading="lazy" />
                                    ) : isVideo ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <Video className="w-10 h-10 text-violet-400" />
                                            <div className="absolute bottom-1 right-1 bg-black/60 text-[9px] text-white px-1 rounded">VIDEO</div>
                                        </div>
                                    ) : (
                                        <Icon className="w-10 h-10 text-zinc-600" />
                                    )}
                                </div>
                                <div className="p-2">
                                    <p className="text-[11px] text-zinc-300 truncate" title={file.originalName}>{file.originalName}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[9px] text-zinc-600">{formatSize(file.fileSize)}</span>
                                        <span className="text-[9px] text-zinc-700">{formatDate(file.createdAt)}</span>
                                    </div>
                                    <p className="text-[9px] text-zinc-700 mt-0.5 truncate">{file.uploadedByName}</p>
                                </div>
                                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={fileApi.getDownloadUrl(file.id)} download
                                        className="p-1 bg-black/70 rounded-md hover:bg-black/90 transition-colors">
                                        <Download className="w-3 h-3 text-white" />
                                    </a>
                                    {(isImage || isVideo) && (
                                        <button onClick={() => setPreview(file)}
                                            className="p-1 bg-black/70 rounded-md hover:bg-black/90 transition-colors">
                                            <Eye className="w-3 h-3 text-white" />
                                        </button>
                                    )}
                                    <button onClick={() => { if (confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) deleteMutation.mutate(file.id); }}
                                        className="p-1 bg-black/70 rounded-md hover:bg-red-900/80 transition-colors">
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button key={i} onClick={() => setPage(i)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === i
                                ? 'bg-orange-500 text-white'
                                : 'bg-white/[0.03] text-zinc-500 hover:text-white'}`}>
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            <AnimatePresence>
                {preview && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setPreview(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="relative max-w-4xl max-h-[85vh] w-full" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setPreview(null)}
                                className="absolute -top-10 right-0 p-1.5 text-zinc-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="bg-[#0C0C0E] rounded-2xl overflow-hidden border border-white/[0.06]">
                                {preview.contentType?.startsWith('image/') ? (
                                    <img src={fileApi.getDownloadUrl(preview.id)} alt={preview.originalName}
                                        className="w-full max-h-[75vh] object-contain" />
                                ) : preview.contentType?.startsWith('video/') ? (
                                    <video src={fileApi.getDownloadUrl(preview.id)} controls autoPlay
                                        className="w-full max-h-[75vh]" />
                                ) : null}
                                <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-white font-medium">{preview.originalName}</p>
                                        <p className="text-[10px] text-zinc-500">{formatSize(preview.fileSize)} · {preview.uploadedByName} · {formatDate(preview.createdAt)}</p>
                                    </div>
                                    <a href={fileApi.getDownloadUrl(preview.id)} download
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-500/20 transition-colors">
                                        <Download className="w-3 h-3" /> İndir
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
