import React, { useState } from 'react';
import { Search, Video, Music, Play, Loader2, CheckCircle2 } from 'lucide-react';

interface DownloaderProps {
    showToast: (msg: string, type?: 'success' | 'info') => void;
}

const Downloader: React.FC<DownloaderProps> = ({ showToast }) => {
    const [url, setUrl] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed'>('idle');
    const [videoData, setVideoData] = useState<{
        title: string;
        thumbnail: string | null;
        duration: string;
        original_url: string;
        estimated_size_mb?: number; // Approximate size
    } | null>(null);

    const handleSearch = async () => {
        if (!url) return;
        setIsSearching(true);
        setVideoData(null);
        setProgress(0);
        setDownloadStatus('idle');

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

            // Calculate rough estimate of size (max video + audio)
            // This is just a heuristic for the progress bar
            const maxVideo = data.formats?.find((f: any) => f.resolution?.includes('720p') || f.resolution?.includes('1080p'))?.size || '10MB';
            const sizeNum = parseFloat(maxVideo.toString().replace('MB', '')) || 20;

            setVideoData({
                ...data,
                estimated_size_mb: sizeNum
            });

        } catch (e: any) {
            showToast(e.message || "Could not find video info", "info");
        } finally {
            setIsSearching(false);
        }
    };

    const handleDownload = async (type: 'video' | 'audio') => {
        if (!videoData) return;
        setDownloadStatus('downloading');
        setProgress(0);

        try {
            const queryParams = new URLSearchParams({
                originalUrl: videoData.original_url,
                title: videoData.title,
                type // 'video' or 'audio'
            });

            const response = await fetch(`/api/stream?${queryParams}`);
            if (!response.body) throw new Error('ReadableStream not supported');

            const contentLength = response.headers.get('Content-Length');
            const total = contentLength
                ? parseInt(contentLength, 10)
                : (videoData.estimated_size_mb || 25) * 1024 * 1024; // Fallback to estimate

            let loaded = 0;
            const reader = response.body.getReader();
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (value) {
                    chunks.push(value);
                    loaded += value.length;
                    // Calculate percentage (cap at 99 until finished)
                    const percent = Math.min(Math.round((loaded / total) * 100), 99);
                    setProgress(percent);
                }
            }

            // Assemble Blob
            const blob = new Blob(chunks, { type: type === 'video' ? 'video/mp4' : 'audio/mpeg' });
            const downloadUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${videoData.title.replace(/[^a-zA-Z0-9]/g, '_')}.${type === 'video' ? 'mp4' : 'mp3'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            setProgress(100);
            setDownloadStatus('completed');
            showToast("Download completed successfully!", "success");

        } catch (error: any) {
            console.error(error);
            showToast("Download failed. Please try again.", "info");
            setDownloadStatus('idle');
            setProgress(0);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center">
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-2">
                    Media Downloader
                </h2>
                <p className="text-gray-500">Save your favorite videos and music instantly.</p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-2 flex gap-2 relative z-10">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste YouTube or Instagram link..."
                    className="flex-1 px-4 py-3 bg-transparent text-gray-700 placeholder-gray-400 outline-none text-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px]"
                >
                    {isSearching ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
                </button>
            </div>

            {/* Result Card */}
            {videoData && (
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative h-64 md:h-80 bg-gray-900 group">
                        {videoData.thumbnail ? (
                            <img
                                src={videoData.thumbnail}
                                alt="Thumbnail"
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Video size={64} className="text-gray-700" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <h3 className="text-2xl font-bold leading-tight line-clamp-2 drop-shadow-md mb-2">{videoData.title}</h3>
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-300">
                                <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                    {videoData.duration || '0:00'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-8 bg-white">
                        {downloadStatus === 'downloading' ? (
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-medium text-gray-600">
                                    <span>Downloading...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-center text-gray-400">Please do not close this tab.</p>
                            </div>
                        ) : downloadStatus === 'completed' ? (
                            <div className="text-center py-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4 animate-bounce">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-800">Download Ready!</h4>
                                <p className="text-gray-500 mb-6">Your file has been saved.</p>
                                <button
                                    onClick={() => setDownloadStatus('idle')}
                                    className="text-emerald-600 font-semibold hover:underline"
                                >
                                    Download another format
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleDownload('video')}
                                    className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gray-900 text-white hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 group"
                                >
                                    <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                                        <Video size={24} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-lg">Download Video</div>
                                        <div className="text-xs text-gray-400">MP4 • 720p+ Audio</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleDownload('audio')}
                                    className="flex items-center justify-center gap-3 p-4 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-lg hover:shadow-xl active:scale-95 group"
                                >
                                    <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                                        <Music size={24} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-lg">Download Audio</div>
                                        <div className="text-xs text-violet-200">MP3 • High Quality</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Downloader;