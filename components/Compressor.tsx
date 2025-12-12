import React, { useState, useRef } from 'react';
import { Upload, Download, FileVideo, X, RefreshCw, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { addToHistory } from '../utils/storage';
import { formatBytes } from '../utils/video';

const Compressor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Strict size control
  const [targetSize, setTargetSize] = useState<string>('');
  const [unit, setUnit] = useState<'KB' | 'MB'>('KB');
  
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
    // We allow a small buffer (5%) over the limit because compression isn't exact
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
         addToHistory({
             action: 'Compressed Image',
             file: file.name,
             type: 'compress',
             size: formatBytes(compressedBlob.size)
         });
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
          bg-white rounded-2xl border-2 border-dashed transition-all cursor-pointer relative
          ${file ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'}
        `}
        style={{ minHeight: '300px' }}
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
           <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
             <button 
                onClick={(e) => { e.stopPropagation(); setFile(null); setCompressedFile(null); setError(null); }}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
             >
               <X size={20} className="text-gray-600" />
             </button>
             
             {file.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Preview" 
                  className="h-32 object-contain rounded-lg shadow-sm mb-4" 
                />
             ) : (
                <div className="h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                   <FileVideo size={48} />
                </div>
             )}
             
             <h3 className="font-semibold text-gray-900 text-lg truncate max-w-xs">{file.name}</h3>
             <p className="text-sm text-gray-500 mt-1">Original: {formatBytes(file.size)}</p>

             {!compressedFile && !isCompressing && (
                <div className="mt-6 w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 text-left">Target File Size</label>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={targetSize}
                                onChange={(e) => setTargetSize(e.target.value)}
                                placeholder="e.g. 500"
                                className="flex-1 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                min="1"
                            />
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value as 'KB' | 'MB')}
                                className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-700"
                            >
                                <option value="KB">KB</option>
                                <option value="MB">MB</option>
                            </select>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-left">We'll strictly attempt to stay under this limit.</p>
                    </div>
                    <button 
                        onClick={compressImage}
                        className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Compress Now
                    </button>
                </div>
             )}

             {isCompressing && (
                 <div className="mt-6 flex flex-col items-center animate-pulse text-emerald-600">
                     <RefreshCw className="animate-spin mb-2" />
                     <span className="text-sm font-medium">Crunching pixels...</span>
                 </div>
             )}
             
             {error && (
                 <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-start gap-2 text-sm text-left">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p>{error}</p>
                 </div>
             )}
           </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-medium text-gray-900">Drop Image</h3>
            <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
              Supports JPG, PNG, WEBP
            </p>
          </div>
        )}
      </div>

      <div className={`bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center transition-opacity duration-500 ${compressedFile ? 'opacity-100' : 'opacity-50 pointer-events-none'}`} style={{ minHeight: '200px' }}>
         {compressedFile ? (
            <div className="w-full max-w-md">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 mx-auto">
                    <Download size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Compression Success!</h3>
                <p className="text-gray-500 mb-6">
                    New size: <span className="font-semibold text-emerald-600">{formatBytes(compressedFile.size)}</span>
                    <span className="text-xs ml-2 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        -{file ? Math.round((1 - compressedFile.size / file.size) * 100) : 0}% saved
                    </span>
                </p>
                <button 
                    onClick={downloadFile}
                    className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                    <Download size={18} />
                    Download Result
                </button>
            </div>
         ) : (
            <>
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                    <Download size={32} />
                </div>
                <p className="text-gray-300">Results will appear here</p>
            </>
         )}
      </div>
    </div>
  );
};

export default Compressor;