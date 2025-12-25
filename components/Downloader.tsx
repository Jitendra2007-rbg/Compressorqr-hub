
import React, { useState } from 'react';
import { Search, Video, Music, Play, Loader2, CheckCircle2, AlertCircle, Download, FileVideo, Music2 } from 'lucide-react';

interface DownloaderProps {
    showToast: (msg: string, type?: 'success' | 'info') => void;
}

const API_BASE = import.meta.env.PROD
    ? 'https://compressorqr-hub.onrender.com'
    : 'http://localhost:10000';

interface VideoFormat {
    id: string;
    ext: string;
    resolution: string;
    size: string;
    quality: number | string;
    is_audio_only: boolean;
}

const Downloader: React.FC<DownloaderProps> = ({ showToast }) => {
    const [url, setUrl] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

    // Download state
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const [videoData, setVideoData] = useState<{
        title: string;
        thumbnail: string | null;
        duration: string;
        original_url: string;
        formats: VideoFormat[];
    } | null>(null);

    const handleSearch = async () => {
        if (!url) return;
        setIsSearching(true);
        setVideoData(null);
        setError('');
        setDownloadingId(null);
        setProgress(0);

        try {
            const res = await fetch(`${API_BASE}/api/probe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to probe video');
            }

            const data = await res.json();
            setVideoData(data);
        } catch (e: any) {
            console.error(e);
            setError(e.message);
            showToast(e.message || "Could not find video info", "info");
        } finally {
            setIsSearching(false);
        }
    };

    const handleDownload = async (type: 'video' | 'audio', quality?: string, id?: string) => {
        if (!videoData) return;
        const currentId = id || quality || 'default';
        setDownloadingId(currentId);
        setProgress(0);

        try {
            const queryParams = new URLSearchParams({
                originalUrl: videoData.original_url,
                title: videoData.title,
                type,
                quality: quality || ''
            });

            const response = await fetch(`${API_BASE}/api/stream?${queryParams}`);
            if (!response.body) throw new Error('ReadableStream not supported');

            const contentLength = response.headers.get('Content-Length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            let loaded = 0;
            const reader = response.body.getReader();
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (value) {
                    chunks.push(value);
                    loaded += value.length;
                    if (total > 0) {
                        const percent = Math.min(Math.round((loaded / total) * 100), 99);
                        setProgress(percent);
                    } else {
                        // Fake progress if no content-length
                        setProgress((p) => Math.min(p + 5, 95));
                    }
                }
            }

            const blob = new Blob(chunks, { type: type === 'video' ? 'video/mp4' : 'audio/mpeg' });
            const downloadUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${videoData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${quality || 'download'}.${type === 'video' ? 'mp4' : 'mp3'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            setProgress(100);
            showToast("Download completed successfully!", "success");
            setDownloadingId(null);

        } catch (error: any) {
            console.error(error);
            showToast("Download failed. Please try again.", "info");
            setDownloadingId(null);
            setProgress(0);
        }
    };

    // Filter and process formats for display
    const getFormats = () => {
        if (!videoData) return [];

        let unique = new Map();

        videoData.formats.forEach(f => {
            if (activeTab === 'video' && !f.is_audio_only && f.resolution.includes('p')) {
                // Group by exact resolution text to avoid duplicates
                // clean resolution string
                const height = f.resolution.match(/(\d+)p/)?.[1] || f.resolution;
                // Prefer formats that have size info
                const key = height;
                if (!unique.has(key) || (!unique.get(key).size.includes('MB') && f.size.includes('MB'))) {
                    unique.set(key, f);
                }
            } else if (activeTab === 'audio' && f.is_audio_only) {
                // Just one MP3 option for now as we convert
                if (!unique.has('mp3')) unique.set('mp3', { ...f, resolution: '128kbps', ext: 'mp3', size: 'Unknown' });
            }
        });

        // Add a guaranteed list for known qualities if missing from raw formats
        if (activeTab === 'video' && unique.size === 0) {
            return [
                { resolution: '1080p', size: 'HD', quality: '1080' },
                { resolution: '720p', size: 'Medium', quality: '720' },
                { resolution: '480p', size: 'SD', quality: '480' }
            ].map((f, i) => ({ ...f, id: `gen_${i}`, ext: 'mp4', is_audio_only: false }));
        }

        if (activeTab === 'audio' && unique.size === 0) {
            return [{ resolution: '128kbps', size: '~3MB', quality: '0', id: 'mp3', ext: 'mp3', is_audio_only: true }];
        }

        return Array.from(unique.values()).sort((a, b) => {
            const hA = parseInt(a.resolution) || 0;
            const hB = parseInt(b.resolution) || 0;
            return hB - hA;
        });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                    Universal Downloader
                </h2>
                <p className="text-gray-500">Download video and audio from YouTube, Instagram, and more.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-2 flex gap-2 relative z-10">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Search or paste link here..."
                    className="flex-1 px-4 py-3 bg-transparent text-gray-700 placeholder-gray-400 outline-none text-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                >
                    {isSearching ? <Loader2 size={24} className="animate-spin" /> : 'Start'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {videoData && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row">
                    {/* Left: Thumbnail & Info */}
                    <div className="md:w-1/3 bg-gray-50 p-6 flex flex-col gap-4 border-r border-gray-100">
                        <div className="relative rounded-lg overflow-hidden shadow-md aspect-video group">
                            {videoData.thumbnail && <img src={videoData.thumbnail} alt={videoData.title} className="w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                {videoData.duration}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 line-clamp-2 mb-1" title={videoData.title}>{videoData.title}</h3>
                            <p className="text-xs text-gray-500 break-all">{videoData.original_url}</p>
                        </div>
                    </div>

                    {/* Right: Download Options */}
                    <div className="md:w-2/3 p-6">
                        <div className="flex gap-4 border-b border-gray-100 mb-4">
                            <button
                                onClick={() => setActiveTab('video')}
                                className={`pb-2 px-4 font-medium text-sm transition-colors relative ${activeTab === 'video' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <div className="flex items-center gap-2"> <FileVideo size={18} /> Video </div>
                                {activeTab === 'video' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('audio')}
                                className={`pb-2 px-4 font-medium text-sm transition-colors relative ${activeTab === 'audio' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <div className="flex items-center gap-2"> <Music2 size={18} /> Audio </div>
                                {activeTab === 'audio' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full" />}
                            </button>
                        </div>

                        <div className="overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs font-semibold text-gray-400 border-b border-gray-100">
                                        <th className="py-2 pl-2">Resolution</th>
                                        <th className="py-2">File Size</th>
                                        <th className="py-2 text-right pr-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFormats().map((fmt, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                            <td className="py-3 pl-2 flex items-center gap-2 font-medium text-gray-700">
                                                {fmt.resolution}
                                                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase">{fmt.ext}</span>
                                            </td>
                                            <td className="py-3 text-sm text-gray-500">{fmt.size}</td>
                                            <td className="py-3 text-right pr-2">
                                                {downloadingId === (fmt.quality?.toString() || fmt.id) ? (
                                                    <div className="flex items-center justify-end gap-2 text-emerald-600">
                                                        <span className="text-xs font-medium">{progress}%</span>
                                                        <div className="w-20 h-2 bg-emerald-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDownload(activeTab, fmt.resolution.replace('p', ''), fmt.quality?.toString() || fmt.id)}
                                                        disabled={!!downloadingId}
                                                        className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                    >
                                                        <Download size={14} /> Download
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {getFormats().length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">No formats found for this category.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Downloader;