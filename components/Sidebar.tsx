import React, { useEffect, useState } from 'react';
import { LayoutDashboard, FileImage, QrCode, Download, User, X, LogIn, Sparkles } from 'lucide-react';
import { AppView } from '../types';
import { supabase } from '../utils/supabaseClient';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.COMPRESSOR, label: 'Compress Media', icon: FileImage },
    { id: AppView.QR_GENERATOR, label: 'QR Generator', icon: QrCode },
    { id: AppView.DOWNLOADER, label: 'Link Downloader', icon: Download },
    { id: AppView.PROFILE, label: 'Profile', icon: User },
  ];

  return (
    <div className={`
      fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-gray-100 shadow-xl lg:shadow-none transform transition-transform duration-300 z-30
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="h-full flex flex-col">
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xl tracking-tight">
            <span className="text-2xl transform -rotate-12">⇲</span> CompressQR
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-emerald-50 text-emerald-600 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'} />
                {item.label}
              </button>
            );
          })}
          
          {/* Mobile Upgrade Link in Nav */}
          <button 
             onClick={() => setCurrentView(AppView.UPGRADE)}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group lg:hidden ${currentView === AppView.UPGRADE ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600'}`}
          >
             <Sparkles size={20} className="text-amber-400" />
             Upgrade Plan
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          {session ? (
            <div className="bg-emerald-50 rounded-xl p-4">
               <div className="flex items-center justify-between mb-2">
                 <p className="text-sm font-semibold text-emerald-800">Free Tier</p>
                 <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
               </div>
               <p className="text-xs text-emerald-600 mb-3 truncate" title={session.user.email}>{session.user.email}</p>
               
               <button 
                 onClick={() => setCurrentView(AppView.UPGRADE)}
                 className="w-full py-2 bg-white text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 border border-emerald-100 shadow-sm"
               >
                 <Sparkles size={14} className="text-amber-500" /> Upgrade to Pro
               </button>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl p-4 text-white">
               <p className="text-sm font-semibold mb-1">Guest Mode</p>
               <p className="text-xs text-gray-400 mb-3">Login to save your history permanently.</p>
               <button 
                 onClick={() => setCurrentView(AppView.AUTH)}
                 className="w-full py-2 bg-white text-gray-900 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
               >
                 <LogIn size={14} /> Login Now
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;