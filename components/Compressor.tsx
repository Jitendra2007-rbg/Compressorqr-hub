import React, { useState, useRef } from 'react';
import { Upload, Download, FileVideo, X, RefreshCw, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { addToHistory } from '../utils/storage';
import { formatBytes } from '../utils/video';

interface CompressorProps {
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

const Compressor: React.FC<CompressorProps> = ({ showToast }) => {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Strict size control
  const [targetSize, setTargetSize] = useState<string>('');
  const [unit, setUnit] = useState<'KB' | 'MB'>('KB');

  // Parse URL for target size (SEO feature)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('target');
    if (target) {
      const match = target.match(/^(\d+)\s*(kb|mb)$/i);
      if (match) {
        setTargetSize(match[1]);
        setUnit(match[2].toUpperCase() as 'KB' | 'MB');
      }
    }
  }, []);

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setCompressedFile(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setCompressedFile(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Helper to strictly compress
  const compressStrictly = async (imageFile: File, targetSizeMB: number): Promise<Blob> => {
    // Initial strict attempt
    let options = {
      maxSizeMB: targetSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.9,
    };

    let currentAttempt = await imageCompression(imageFile, options);

    // Iterative Reduction Loop
    let iterations = 0;
    const limitBytes = targetSizeMB * 1024 * 1024;

    while (currentAttempt.size > limitBytes && iterations < 5) {
      iterations++;
      const newQuality = Math.max(0.1, 0.9 - (iterations * 0.15));
      const newScale = Math.max(500, 1920 - (iterations * 300));

      currentAttempt = await imageCompression(imageFile, {
        maxSizeMB: targetSizeMB,
        maxWidthOrHeight: newScale,
        initialQuality: newQuality,
        useWebWorker: true,
      });
    }

    return currentAttempt;
  };

  const compressImage = async () => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Strict compression is currently available for Images only.");
      return;
    }

    const sizeValue = parseFloat(targetSize);
    if (!targetSize || isNaN(sizeValue) || sizeValue <= 0) {
      setError("Please enter a valid target file size.");
      return;
    }

    setIsCompressing(true);
    setError(null);

    // Calculate maxSizeMB
    const targetMB = unit === 'KB' ? sizeValue / 1024 : sizeValue;

    try {
      const compressedBlob = await compressStrictly(file, targetMB);

      // Final check
      if (compressedBlob.size > targetMB * 1024 * 1024 * 1.1) { // 10% margin
        setError(`Could not strictly reach ${targetSize}${unit}. Best result: ${formatBytes(compressedBlob.size)}`);
      } else {
        // Success - Add to history
        const status = await addToHistory({
          action: 'Compressed Image',
          file: file.name,
          type: 'compress',
          size: formatBytes(compressedBlob.size)
        });

        if (status === 'local') {
          showToast("Login to save your history permanently.", "info");
        } else {
          showToast("Compressed successfully & saved to cloud!", "success");
        }
      }

      setCompressedFile(compressedBlob);
    } catch (err) {
      console.error(err);
      setError('Compression failed. Try a larger target size.');
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadFile = () => {
    if (!compressedFile) return;
    const url = URL.createObjectURL(compressedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = `min_${file?.name || 'file'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Media Compressor</h2>
        <p className="text-gray-500">Reduce file size strictly to your requirements.</p>
      </div>

      <div
        className={`
          bg-white rounded-2xl border-2 border-dashed transition-all relative overflow-hidden
          ${file ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50 cursor-pointer'}
        `}
        style={{ minHeight: file ? '140px' : '70px' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {file ? (
          <div className="p-3 h-full flex flex-col md:flex-row items-center gap-4">
            {/* Close Button */}
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setCompressedFile(null); setError(null); }}
              className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur shadow-sm rounded-full hover:bg-red-50 hover:text-red-500 transition-colors z-20"
            >
              <X size={14} />
            </button>

            {/* Preview Image/Icon */}
            <div className="shrink-0">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded-lg shadow-sm border border-gray-100 bg-white"
                />
              ) : (
                <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                  <FileVideo size={24} />
                </div>
              )}
            </div>

            {/* File Info & Controls */}
            <div className="flex-1 w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{file.name}</h3>
                <p className="text-[10px] text-gray-500">Original: <span className="font-medium text-gray-700">{formatBytes(file.size)}</span></p>
                {error && (
                  <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                    <AlertCircle size={10} /> {error}
                  </p>
                )}
              </div>

              <div className="w-full md:max-w-xs bg-white/50 p-1.5 rounded-lg border border-emerald-100/50" onClick={e => e.stopPropagation()}>
                {!compressedFile && !isCompressing && (
                  <div className="space-y-1.5">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Target Max Size</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={targetSize}
                          onChange={(e) => setTargetSize(e.target.value)}
                          placeholder="500"
                          className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                          min="1"
                        />
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value as 'KB' | 'MB')}
                          className="px-1 py-1 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none font-medium text-gray-700"
                        >
                          <option value="KB">KB</option>
                          <option value="MB">MB</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={compressImage}
                      className="w-full py-1 bg-emerald-500 text-white text-xs font-semibold rounded shadow-sm hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={12} /> Compress
                    </button>
                  </div>
                )}

                {isCompressing && (
                  <div className="flex flex-col items-center justify-center py-1 text-emerald-600">
                    <RefreshCw className="animate-spin mb-0.5" size={16} />
                    <span className="text-[10px] font-medium">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-2 text-center min-h-[70px]">
            <div className="flex items-center gap-2 text-gray-500">
              <Upload size={16} className="text-emerald-500" />
              <h3 className="text-sm font-medium text-gray-900">Click or Drop Image</h3>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Supports JPG, PNG, WEBP (Strict Mode)
            </p>
          </div>
        )}
      </div>

      <div className={`bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center text-center transition-opacity duration-500 ${compressedFile ? 'opacity-100' : 'opacity-50 pointer-events-none'}`} style={{ minHeight: '120px' }}>
        {compressedFile ? (
          <div className="w-full max-w-lg flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-left flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                <Download size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">Compression Ready!</h3>
                <p className="text-gray-500 text-sm">
                  <span className="font-semibold text-emerald-600">{formatBytes(compressedFile.size)}</span>
                  <span className="text-xs ml-2 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full inline-block">
                    -{file ? Math.round((1 - compressedFile.size / file.size) * 100) : 0}%
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={downloadFile}
              className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Download File
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <p>Compressed files will appear here</p>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compressor;