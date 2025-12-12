import React, { useState } from 'react';
import { Search, Video, Download, Play, AlertCircle, Loader2 } from 'lucide-react';
import { VideoQuality } from '../types';

interface DownloaderProps {
    showToast: (msg: string, type?: 'success' | 'info') => void;
}

const Downloader: React.FC<DownloaderProps> = ({ showToast }) => {
    const [url, setUrl] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [videoData, setVideoData] = useState<{
        title: string;
        thumbnail: string | null;
        formats: any[];
        original_url: string;
    } | null>(null);

    const handleSearch = async () => {
        if (!url) return;
        setIsSearching(true);
        setVideoData(null);

        try {
            const res = await fetch('/api/probe', {
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
            showToast(e.message || "Could not find video info", "info");
        } finally {
            setIsSearching(false);
        }
    };

    const handleDownload = async (format: any) => {
        if (!videoData) return;

        // Create direct download link
        const downloadUrl = `/api/stream?url=${encodeURIComponent(videoData.original_url)}&format_id=${format.format_id}&title=${encodeURIComponent(videoData.title)}&ext=${format.ext}`;

        // Trigger download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Universal Downloader</h2>
                <p className="text-gray-500">Download videos via direct stream.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste video link here..."
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 rounded-xl transition-colors shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSearching ? <Loader2 size={22} className="animate-spin" /> : <Search size={22} />}
                    </button>
                </div>
            </div>

            {videoData && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in shadow-lg">
                    <div className="flex flex-col md:flex-row">
                        <div className="md:w-5/12 bg-gray-900 flex items-center justify-center relative min-h-[180px] md:min-h-full">
                            {videoData.thumbnail ? (
                                <>
                                    <img src={videoData.thumbnail} alt="Thumb" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                    <div className="relative z-10 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg">
                                        <Play fill="currentColor" size={20} className="ml-1" />
                                    </div>
                                </>
                            ) : (
                                <Video size={48} className="text-white/20" />
                            )}
                        </div>

                        <div className="md:w-7/12 p-6 flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{videoData.title}</h3>
                                <p className="text-xs text-gray-500">Select Quality:</p>
                            </div>

                            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {videoData.formats.map((f, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleDownload(f)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                <Download size={16} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{f.resolution} <span className="text-xs font-normal text-gray-500">({f.ext})</span></p>
                                                <p className="text-[10px] text-gray-500">{f.filesize} {f.note && `• ${f.note}`}</p>
                                                {f.vcodec !== 'none' && f.acodec !== 'none' ? <span className="text-[10px] text-green-600">Video+Audio</span> : <span className="text-[10px] text-orange-500">{f.vcodec === 'none' ? 'Audio Only' : 'Video Only'}</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Downloader;