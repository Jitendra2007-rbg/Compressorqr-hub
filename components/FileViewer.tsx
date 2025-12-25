
import React, { useEffect, useState } from 'react';
import { Download, Share2, FileText, Image as ImageIcon, ArrowLeft } from 'lucide-react';

interface FileViewerProps {
    id: string;
    onBack?: () => void;
}

const API_BASE = import.meta.env.PROD
    ? 'https://compressorqr-hub.onrender.com'
    : 'http://localhost:10000';

const FileViewer: React.FC<FileViewerProps> = ({ id, onBack }) => {
    const [isImage, setIsImage] = useState(false);
    const [error, setError] = useState(false);

    // Construct URLs
    const downloadUrl = `${API_BASE}/share/${id}`;
    const previewUrl = `${API_BASE}/share/${id}?preview=true`;

    useEffect(() => {
        // Simple check to see if it's an image
        const img = new Image();
        img.src = previewUrl;
        img.onload = () => setIsImage(true);
        img.onerror = () => setIsImage(false);
    }, [id, previewUrl]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Shared File',
                    text: 'Check out this file shared via CompressQR',
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    {onBack ? (
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <ArrowLeft size={20} />
                        </button>
                    ) : <div />}
                    <h3 className="font-semibold text-gray-700">Shared File</h3>
                    <div className="w-8" />
                </div>

                <div className="bg-gray-50 p-8 flex items-center justify-center min-h-[300px]">
                    {isImage ? (
                        <img
                            src={previewUrl}
                            alt="Shared Content"
                            className="max-w-full max-h-[400px] rounded-lg shadow-sm object-contain"
                            onError={() => setError(true)}
                        />
                    ) : (
                        <div className="text-center text-gray-400">
                            <FileText size={64} className="mx-auto mb-4 text-emerald-500/50" />
                            <p className="text-sm font-medium text-gray-500">Preview not available for this file type</p>
                            <p className="text-xs mt-1">Please download to view</p>
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-3 bg-white">
                    <a
                        href={downloadUrl}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all shadow-md active:scale-95"
                    >
                        <Download size={20} />
                        Download File
                    </a>

                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all"
                    >
                        <Share2 size={20} />
                        Share Link
                    </button>
                </div>
            </div>

            <div className="mt-8 text-center">
                <a href="/" className="text-emerald-600 font-medium hover:underline text-sm">
                    Create your own QR Code
                </a>
            </div>
        </div>
    );
};

export default FileViewer;
