import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Clock, FileImage, QrCode, Download } from 'lucide-react';
import { getHistory, formatDate, clearHistory } from '../utils/storage';
import { ActivityItem } from '../types';

const Profile: React.FC = () => {
  const [history, setHistory] = useState<ActivityItem[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'compress': return <FileImage size={16} className="text-emerald-500" />;
      case 'qr': return <QrCode size={16} className="text-blue-500" />;
      case 'download': return <Download size={16} className="text-purple-500" />;
      default: return <Clock size={16} />;
    }
  };

  const handleClearHistory = () => {
      clearHistory();
      setHistory([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Profile</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
         <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <User size={32} />
         </div>
         <h3 className="text-xl font-bold text-gray-900 mb-2">Guest User</h3>
         <p className="text-gray-500 mb-6 max-w-md mx-auto">
           Your history is saved locally in this browser. Upgrade to Pro to sync across devices.
         </p>
         <button className="px-6 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">
            Sign In / Register
         </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-gray-900">Activity History</h3>
             {history.length > 0 && (
                 <button onClick={handleClearHistory} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear History</button>
             )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-500">
                <tr>
                    <th className="px-4 py-3 font-medium rounded-l-lg">Action</th>
                    <th className="px-4 py-3 font-medium">File/Details</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium rounded-r-lg">Date</th>
                </tr>
             </thead>
             <tbody>
                {history.length > 0 ? (
                    history.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 flex items-center gap-2 font-medium text-gray-700">
                                {getIcon(item.type)} {item.action}
                            </td>
                            <td className="px-4 py-4 text-gray-500 max-w-xs truncate" title={item.file}>
                                {item.file}
                            </td>
                            <td className="px-4 py-4 text-gray-500">
                                {item.size || '-'}
                            </td>
                            <td className="px-4 py-4 text-gray-400 text-xs">
                                {formatDate(item.date)}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                            No activity recorded yet. Start using the tools!
                        </td>
                    </tr>
                )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Profile;