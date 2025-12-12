import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Link, FileText, Image as ImageIcon, X } from 'lucide-react';
import { addToHistory } from '../utils/storage';

interface QRGeneratorProps {
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ showToast }) => {
  const [content, setContent] = useState('https://compressorqr-hub.onrender.com');
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const mockHostedUrl = `https://compressqr.hub/share/${Date.now()}/${file.name.replace(/\s/g, '_')}`;
      setContent(mockHostedUrl);

      const status = await addToHistory({
        action: 'Generated File QR',
        file: file.name,
        type: 'qr',
        size: 'N/A'
      });
      if (status === 'local') showToast("Login to save your history permanently.", "info");
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
  };

  const downloadQR = async () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (activeTab === 'text' && content) {
        const status = await addToHistory({
          action: 'Generated Text QR',
          file: content.substring(0, 30) + '...',
          type: 'qr',
        });
        if (status === 'local') showToast("Login to save your history permanently.", "info");
      }
    }
  };

  const resetFile = () => {
    setSelectedFile(null);
    setContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">QR Generator</h2>
        <p className="text-gray-500">Generate unlimited QR codes. No login required.</p>
      </div>

      <div className="bg-white p-1 rounded-xl inline-flex w-full shadow-sm border border-gray-100">
        <button
          onClick={() => { setActiveTab('text'); resetFile(); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'text' ? 'bg-white text-emerald-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Text / URL
        </button>
        <button
          onClick={() => { setActiveTab('file'); setContent(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'file' ? 'bg-white text-emerald-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
        >
          File (PDF/Img/Vid)
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {activeTab === 'text' ? 'Enter Content' : 'Upload File'}
        </label>

        {activeTab === 'text' ? (
          <input
            type="text"
            value={content}
            onChange={handleTextChange}
            placeholder="https://example.com or plain text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
        ) : (
          <div
            className={`w-full px-4 py-8 bg-gray-50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative ${selectedFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-200 hover:bg-gray-100'}`}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedFile ? (
              <div className="flex items-center gap-3 relative z-10" onClick={(e) => e.stopPropagation()}>
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <FileText size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-xs text-emerald-600">Link Generated!</p>
                </div>
                <button onClick={resetFile} className="p-1 hover:bg-gray-200 rounded-full ml-2">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <FileText className="text-gray-400 mb-2" size={32} />
                <span className="text-sm text-gray-500">Click to upload Image, Video or PDF</span>
                <span className="text-xs text-gray-400 mt-1">Generates a shareable scan link</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 text-center text-sm font-medium text-gray-600">
          QR Preview
        </div>
        <div className="p-8 flex flex-col items-center justify-center">
          {content ? (
            <>
              <div ref={qrRef} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <QRCodeCanvas
                  value={content}
                  size={200}
                  level={"H"}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  includeMargin={true}
                />
              </div>
              {activeTab === 'file' && (
                <p className="text-xs text-gray-400 mt-4 max-w-xs text-center">
                  Scanned code redirects to: <br /> <span className="text-emerald-500">{content.substring(0, 30)}...</span>
                </p>
              )}
              <div className="mt-6 flex gap-3 w-full max-w-xs">
                <button
                  onClick={downloadQR}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} /> PNG
                </button>
              </div>
            </>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-gray-300">
              <ImageIcon size={48} className="mb-2 opacity-20" />
              <p>Enter content or upload file</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;