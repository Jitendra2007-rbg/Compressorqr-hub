import React, { useState, useEffect } from 'react';
import { User, LogOut, Clock, FileImage, QrCode, Download, Cloud } from 'lucide-react';
import { getHistory, formatDate, clearHistory } from '../utils/storage';
import { ActivityItem, AppView } from '../types';
import { supabase } from '../utils/supabaseClient';

interface ProfileProps {
  onViewChange: (view: AppView) => void;
}

const Profile: React.FC<ProfileProps> = ({ onViewChange }) => {
  const [history, setHistory] = useState<ActivityItem[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Load History
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getHistory();
    setHistory(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    loadHistory(); // Reloads local history
  };

  const handleClearHistory = async () => {
      // If logged in, we might want to delete from server, currently util only does local.
      // We will clear local for now as per util.
      clearHistory();
      setHistory([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'compress': return <FileImage size={16} className="text-emerald-500" />;
      case 'qr': return <QrCode size={16} className="text-blue-500" />;
      case 'download': return <Download size={16} className="text-purple-500" />;
      default: return <Clock size={16} />;
    }
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
         {session ? (
             <>
               <h3 className="text-xl font-bold text-gray-900 mb-1">Welcome Back</h3>
               <p className="text-emerald-600 font-medium mb-6">{session.user.email}</p>
               <button 
                  onClick={handleLogout}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors shadow-sm flex items-center justify-center gap-2 mx-auto"
               >
                  <LogOut size={16} /> Sign Out
               </button>
             </>
         ) : (
             <>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Guest User</h3>
               <p className="text-gray-500 mb-6 max-w-md mx-auto">
                 Your history is currently saved in this browser. Login to sync with the cloud.
               </p>
               <button 
                  onClick={() => onViewChange(AppView.AUTH)}
                  className="px-6 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
               >
                  Sign In / Register
               </button>
             </>
         )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                 <h3 className="text-lg font-semibold text-gray-900">Activity History</h3>
                 {session && <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Cloud size={10} /> Synced</span>}
             </div>
             {history.length > 0 && !session && (
                 <button onClick={handleClearHistory} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear Local</button>
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
                {loading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading history...</td></tr>
                ) : history.length > 0 ? (
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