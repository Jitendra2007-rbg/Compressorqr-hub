import React from 'react';
import { LayoutDashboard, FileImage, QrCode, Download, User, X } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
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
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-emerald-500 rounded-xl p-4 text-white">
             <p className="text-sm font-semibold mb-1">Pro Plan</p>
             <p className="text-xs text-emerald-100 mb-3">Unlock 4K downloads & unlimited compression.</p>
             <button 
               onClick={() => setCurrentView(AppView.UPGRADE)}
               className="w-full py-2 bg-white text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors"
             >
               Upgrade Now
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;