import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Loader2, CheckCircle } from 'lucide-react';
import { fileApi } from '../api/features';

interface FileUploaderProps {
    entityType: string;
    entityId: string;
    onUploadComplete?: () => void;
    accept?: string;
    maxSizeMB?: number;
}

interface UploadItem {
    file: File;
    status: 'pending' | 'uploading' | 'done' | 'error';
    error?: string;
}

export default function FileUploader({ entityType, entityId, onUploadComplete, accept, maxSizeMB = 50 }: FileUploaderProps) {
    const [items, setItems] = useState<UploadItem[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((files: FileList | File[]) => {
        const newItems: UploadItem[] = Array.from(files).map(file => ({
            file,
            status: file.size > maxSizeMB * 1024 * 1024 ? 'error' as const : 'pending' as const,
            error: file.size > maxSizeMB * 1024 * 1024 ? `Dosya ${maxSizeMB}MB sınırını aşıyor` : undefined,
        }));
        setItems(prev => [...prev, ...newItems]);
    }, [maxSizeMB]);

    const uploadAll = async () => {
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            if (item.status !== 'pending') continue;

            setItems(prev => prev.map((it, i) => i === idx ? { ...it, status: 'uploading' } : it));
            try {
                await fileApi.upload(item.file, entityType, entityId);
                setItems(prev => prev.map((it, i) => i === idx ? { ...it, status: 'done' } : it));
            } catch {
                setItems(prev => prev.map((it, i) => i === idx ? { ...it, status: 'error', error: 'Yükleme başarısız' } : it));
            }
        }
        onUploadComplete?.();
    };

    const removeItem = (idx: number) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const hasPending = items.some(i => i.status === 'pending');
    const hasUploading = items.some(i => i.status === 'uploading');

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${dragOver
                        ? 'border-orange-500/50 bg-orange-500/5'
                        : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
                    }`}
            >
                <Upload className={`w-6 h-6 ${dragOver ? 'text-orange-400' : 'text-zinc-600'}`} />
                <p className="text-[13px] text-zinc-400">
                    Dosya sürükleyin veya <span className="text-orange-400 font-medium">tıklayarak seçin</span>
                </p>
                <p className="text-[10px] text-zinc-700">Maks. {maxSizeMB}MB</p>
            </div>

            <input
                ref={inputRef}
                type="file"
                multiple
                accept={accept}
                className="hidden"
                onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
            />

            {/* File list */}
            {items.length > 0 && (
                <div className="space-y-1.5">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                            <File className="w-4 h-4 text-zinc-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] text-zinc-300 truncate">{item.file.name}</p>
                                <p className={`text-[10px] ${item.status === 'error' ? 'text-red-400' : 'text-zinc-600'}`}>
                                    {item.status === 'error' ? item.error : formatSize(item.file.size)}
                                </p>
                            </div>
                            {item.status === 'uploading' && <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />}
                            {item.status === 'done' && <CheckCircle className="w-4 h-4 text-pink-400" />}
                            {(item.status === 'pending' || item.status === 'error') && (
                                <button onClick={() => removeItem(idx)} className="text-zinc-600 hover:text-zinc-400">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}

                    {hasPending && (
                        <button
                            onClick={uploadAll}
                            disabled={hasUploading}
                            className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-colors"
                        >
                            {hasUploading ? 'Yükleniyor...' : `${items.filter(i => i.status === 'pending').length} Dosya Yükle`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
