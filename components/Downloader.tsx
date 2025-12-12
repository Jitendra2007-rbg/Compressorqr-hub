import React, { useState } from 'react';
import { Search, Video, Download, Play, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { parseVideoUrl } from '../utils/video';
import { addToHistory } from '../utils/storage';
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
    platform: string;
    qualities: VideoQuality[];
  } | null>(null);

  // Use a reliable public API for processing
  const API_ENDPOINT = "https://api.cobalt.tools/api/json";

  const handleSearch = async () => {
    if (!url) return;
    setIsSearching(true);
    setVideoData(null);
    
    // Check if it's a direct link by extension
    const isDirect = url.match(/\.(mp4|webm|ogg|mov|mkv)$/i);

    if (isDirect) {
        setTimeout(() => {
            setIsSearching(false);
            setVideoData({
                title: url.split('/').pop() || 'Direct Video File',
                thumbnail: null,
                platform: 'direct',
                qualities: [
                    { label: 'Original Quality', size: 'Source' },
                ]
            });
        }, 600);
        return;
    }

    // Identify Platform
    const { platform } = parseVideoUrl(url);
    
    // For social links, we try to get metadata or just show generic info
    try {
        let title = 'Video Found';
        let thumb = null;

        if (platform === 'youtube') {
            try {
                const res = await fetch(`https://noembed.com/embed?url=${url}`);
                const data = await res.json();
                if (data.title) {
                    title = data.title;
                    thumb = data.thumbnail_url;
                }
            } catch (e) {
                title = "YouTube Video";
            }
        } else if (platform === 'instagram' || platform === 'tiktok' || platform === 'twitter') {
             title = `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`;
        }

        setIsSearching(false);
        
        // We offer one "Best Quality" option because Cobalt/Tools usually return the best available stream
        setVideoData({
            title: title,
            thumbnail: thumb,
            platform: platform === 'unknown' ? 'web' : platform,
            qualities: [
                { label: 'Best Quality (MP4)', size: 'Auto' },
                { label: 'Audio Only (MP3)', size: 'Audio' }
            ]
        });

    } catch (e) {
        setIsSearching(false);
        setVideoData({
            title: 'Video Link',
            thumbnail: null,
            platform: 'web',
            qualities: [
                { label: 'Download Media', size: 'Auto' }
            ]
        });
    }
  };

  const handleDownload = async (quality: VideoQuality) => {
      if (!url) return;
      setIsDownloading(true);

      const status = await addToHistory({
          action: `Downloaded ${videoData?.platform} media`,
          file: videoData?.title || url,
          type: 'download',
          size: quality.label
      });
      if (status === 'local') showToast("Login to save your download history permanently!", "info");

      // 1. DIRECT FILES
      const isDirect = url.match(/\.(mp4|webm|ogg|mov|mkv)$/i);
      if (isDirect) {
          try {
              // Create a temporary anchor to force download
              const a = document.createElement('a');
              a.href = url;
              a.download = url.split('/').pop() || 'video.mp4';
              a.target = '_blank'; // Fallback
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              showToast("Download started!", "success");
          } catch(e) {
              window.open(url, '_blank');
          } finally {
              setIsDownloading(false);
          }
          return;
      }

      // 2. SOCIAL MEDIA / PLATFORM VIDEOS (Using Cobalt API)
      try {
          // Prepare headers and body for Cobalt API
          const requestBody = {
              url: url,
              vCodec: "h264",
              vQuality: "1080",
              aFormat: "mp3",
              isAudioOnly: quality.label.includes("Audio"),
          };

          const response = await fetch(API_ENDPOINT, {
              method: 'POST',
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
          });

          const data = await response.json();

          if (data.status === 'stream' || data.status === 'redirect') {
              // We got a direct link!
              const streamUrl = data.url;
              window.location.href = streamUrl; // Navigate to download/stream
              showToast("Download link generated!", "success");
          } else if (data.status === 'picker') {
              // Multiple options found, pick first
              if (data.picker && data.picker.length > 0) {
                  window.location.href = data.picker[0].url;
                  showToast("Download link generated!", "success");
              } else {
                  throw new Error("No stream found");
              }
          } else if (data.status === 'error') {
              throw new Error(data.text || "Could not process video");
          } else {
              // Fallback for unknown status
              throw new Error("Unknown response from processor");
          }

      } catch (error: any) {
          console.error("API Error:", error);
          
          // Fallback mechanism: Open a trusted external downloader
          // This ensures the user ALWAYS gets their video even if our API fails
          const confirmFallback = window.confirm(
              "Direct download processing failed (likely due to platform restrictions). Open in dedicated downloader tab?"
          );
          
          if (confirmFallback) {
              if (url.includes('youtube') || url.includes('youtu.be')) {
                  window.open(url.replace('youtube.com', 'ssyoutube.com').replace('youtu.be/', 'ssyoutube.com/'), '_blank');
              } else if (url.includes('instagram')) {
                  window.open('https://snapinsta.app/', '_blank');
              } else if (url.includes('tiktok')) {
                  window.open('https://snaptik.app/', '_blank');
              } else {
                  window.open(`https://dirpy.com/studio?url=${encodeURIComponent(url)}`, '_blank');
              }
          } else {
              showToast(error.message || "Download failed", "info");
          }
      } finally {
          setIsDownloading(false);
      }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Universal Downloader</h2>
        <p className="text-gray-500">Download videos from YouTube, Instagram, TikTok, etc.</p>
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
              <Search size={22} />
            </button>
        </div>
        
        <div className="flex gap-2 text-xs overflow-x-auto pb-1">
            <button 
                onClick={() => setUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')} 
                className="bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-600 whitespace-nowrap"
            >
                Test YouTube
            </button>
             <button 
                onClick={() => setUrl('https://www.w3schools.com/html/mov_bbb.mp4')} 
                className="bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-600 whitespace-nowrap"
            >
                Test Direct MP4
            </button>
        </div>
        
        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex items-start gap-2">
           <AlertCircle size={14} className="mt-0.5 shrink-0" />
           <p>We use advanced processing to fetch videos. If direct download fails, a backup option will be offered.</p>
        </div>
      </div>

      {/* Result Area */}
      {isSearching && (
         <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-500 font-medium">Analyzing link...</p>
         </div>
      )}

      {!isSearching && videoData && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in shadow-lg">
             <div className="flex flex-col md:flex-row">
                {/* Thumbnail Section */}
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
                
                {/* Details & Options Section */}
                <div className="md:w-7/12 p-6 flex flex-col">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider">{videoData.platform}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{videoData.title}</h3>
                        <p className="text-xs text-gray-500">Choose format:</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {videoData.qualities.map((q, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleDownload(q)}
                                disabled={isDownloading}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left disabled:opacity-50 disabled:cursor-wait"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        <Download size={16} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{q.label}</p>
                                        <p className="text-[10px] text-gray-500">{q.size}</p>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors shadow-sm flex items-center gap-1">
                                    {isDownloading ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            Download <Download size={14} />
                                        </>
                                    )}
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