import React, { useState } from 'react';
import { Search, Globe, Video, Download, Play, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { parseVideoUrl, getThumbnail } from '../utils/video';
import { addToHistory } from '../utils/storage';
import { VideoQuality } from '../types';

const Downloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [videoData, setVideoData] = useState<{
    title: string;
    thumbnail: string | null;
    platform: string;
    qualities: VideoQuality[];
  } | null>(null);

  const handleSearch = async () => {
    if (!url) return;
    setIsSearching(true);
    setVideoData(null);
    
    // Check if it's a direct link
    const isDirect = url.match(/\.(mp4|webm|ogg|mov)$/i);

    if (isDirect) {
        setTimeout(() => {
            setIsSearching(false);
            setVideoData({
                title: url.split('/').pop() || 'Direct Video File',
                thumbnail: null,
                platform: 'direct',
                qualities: [{ label: 'Original', size: 'Unknown' }]
            });
        }, 800);
        return;
    }

    // Parse Social URLs
    const { platform, id } = parseVideoUrl(url);
    
    setTimeout(() => {
        setIsSearching(false);
        if (platform === 'youtube' && id) {
            setVideoData({
                title: `YouTube Video (${id})`,
                thumbnail: getThumbnail(platform, id),
                platform: 'youtube',
                qualities: [
                    { label: '1080p', size: '124.5 MB' },
                    { label: '720p', size: '68.2 MB' },
                    { label: '480p', size: '32.1 MB' },
                    { label: 'MP3 Audio', size: '4.5 MB' },
                ]
            });
        } else if (platform === 'instagram') {
             setVideoData({
                title: `Instagram Reel/Post (${id || 'Unknown'})`,
                thumbnail: getThumbnail(platform, id),
                platform: 'instagram',
                qualities: [
                    { label: 'Original Quality', size: '~15 MB' },
                    { label: 'Data Saver', size: '~5 MB' },
                ]
            });
        } else {
             setVideoData({
                title: 'Unknown / Generic Video',
                thumbnail: null,
                platform: 'other',
                qualities: [{ label: 'Standard', size: 'Unknown' }]
            });
        }
    }, 1200);
  };

  const handleDownload = async (quality: VideoQuality) => {
      if (!url) return;
      
      // Log to history
      addToHistory({
          action: `Downloaded ${videoData?.platform} video`,
          file: videoData?.title || url,
          type: 'download',
          size: quality.size
      });

      const isDirect = url.match(/\.(mp4|webm|ogg|mov)$/i);

      if (isDirect) {
          try {
              const response = await fetch(url);
              if (!response.ok) throw new Error('Network error');
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = url.split('/').pop() || 'video.mp4';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(blobUrl);
          } catch (e) {
              window.open(url, '_blank');
          }
      } else {
          // Simulate Social Download for UI completeness
          // Since we can't bypass CORS for real YT/IG downloads without a backend proxy:
          const dummyFile = 'https://www.w3schools.com/html/mov_bbb.mp4';
          const a = document.createElement('a');
          a.href = dummyFile;
          a.download = `${videoData?.title}_${quality.label}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          alert(`Download started for ${quality.label}. (Demo: Using sample video due to browser CORS restrictions)`);
      }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Universal Downloader</h2>
        <p className="text-gray-500">Download videos from YouTube, Instagram, or direct links.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex gap-2">
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste URL (YouTube, Instagram, or Direct MP4)..." 
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 rounded-xl transition-colors shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Search size={22} />
            </button>
        </div>
        
        <div className="flex gap-2 text-xs overflow-x-auto pb-1">
            <button 
                onClick={() => setUrl('https://www.w3schools.com/html/mov_bbb.mp4')} 
                className="bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-600 whitespace-nowrap"
            >
                Direct MP4
            </button>
            <button 
                onClick={() => setUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')} 
                className="bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-600 whitespace-nowrap"
            >
                YouTube Demo
            </button>
            <button 
                onClick={() => setUrl('https://www.instagram.com/reel/C8_xyz123')} 
                className="bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-600 whitespace-nowrap"
            >
                Instagram Demo
            </button>
        </div>
      </div>

      {/* Result Area */}
      {isSearching && (
         <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-500 font-medium">Fetching video metadata...</p>
         </div>
      )}

      {!isSearching && videoData && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in shadow-lg">
             <div className="grid md:grid-cols-2">
                <div className="bg-gray-900 flex items-center justify-center relative min-h-[250px] p-4">
                    {videoData.thumbnail ? (
                        <>
                           <img src={videoData.thumbnail} alt="Thumb" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                           <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                               <Play fill="currentColor" size={24} className="ml-1" />
                           </div>
                        </>
                    ) : (
                        <Video size={64} className="text-white/20" />
                    )}
                </div>
                
                <div className="p-6 flex flex-col justify-center">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            {videoData.platform === 'youtube' && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">YOUTUBE</span>}
                            {videoData.platform === 'instagram' && <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-[10px] font-bold rounded">INSTAGRAM</span>}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{videoData.title}</h3>
                        <p className="text-sm text-gray-500">Select quality to download:</p>
                    </div>

                    <div className="space-y-3">
                        {videoData.qualities.map((q, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                                        <Video size={16} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{q.label}</p>
                                        <p className="text-xs text-gray-500">{q.size}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDownload(q)}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                >
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          </div>
      )}

      {!isSearching && !videoData && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
               <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-200 mb-6">
                    <Smartphone size={40} />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Download</h3>
               <p className="text-gray-500 max-w-sm">Paste a valid link from YouTube, Instagram, or a direct file URL to get started.</p>
          </div>
      )}
    </div>
  );
};

export default Downloader;