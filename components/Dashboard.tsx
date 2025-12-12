import React, { useEffect, useState } from 'react';
import { FileImage, QrCode, Download, Clock } from 'lucide-react';
import { AppView, ActivityItem } from '../types';
import { getHistory, formatDate } from '../utils/storage';

interface DashboardProps {
  onViewChange: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const [recentItems, setRecentItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const history = getHistory();
    setRecentItems(history.slice(0, 5)); // Show top 5
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'compress': return <FileImage size={16} className="text-emerald-500" />;
      case 'qr': return <QrCode size={16} className="text-blue-500" />;
      case 'download': return <Download size={16} className="text-purple-500" />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-500">Welcome back! Here is your recent activity.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Compress Media Card */}
        <button 
          onClick={() => onViewChange(AppView.COMPRESSOR)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all group flex flex-col justify-between text-left h-40"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors mb-4">
            <FileImage size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Compress Media</h3>
            <p className="text-sm text-gray-500">Optimize images & videos</p>
          </div>
        </button>

        {/* Generate QR Card */}
        <button 
          onClick={() => onViewChange(AppView.QR_GENERATOR)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group flex flex-col justify-between text-left h-40"
        >
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors mb-4">
            <QrCode size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Generate QR</h3>
            <p className="text-sm text-gray-500">Create & share codes</p>
          </div>
        </button>

        {/* Link Downloader Card */}
        <button 
          onClick={() => onViewChange(AppView.DOWNLOADER)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group flex flex-col justify-between text-left h-40"
        >
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors mb-4">
            <Download size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Link Downloader</h3>
            <p className="text-sm text-gray-500">Save web videos</p>
          </div>
        </button>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
           {recentItems.length > 0 ? (
             <div className="divide-y divide-gray-50">
                {recentItems.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-50 rounded-lg">
                                {getIcon(item.type)}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{item.action}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.file}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             {item.size && <p className="text-xs font-medium text-emerald-600">{item.size}</p>}
                             <p className="text-[10px] text-gray-400">{formatDate(item.date)}</p>
                        </div>
                    </div>
                ))}
             </div>
           ) : (
             <div className="p-12 text-center text-gray-400">
                No recent activity found. Start compressing or downloading!
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;