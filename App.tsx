import React, { useState } from 'react';
import { Menu, LayoutDashboard, FileImage, QrCode, Download, User } from 'lucide-react';
import { AppView } from './types';
import Dashboard from './components/Dashboard';
import Compressor from './components/Compressor';
import QRGenerator from './components/QRGenerator';
import Downloader from './components/Downloader';
import Profile from './components/Profile';
import Upgrade from './components/Upgrade';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onViewChange={setCurrentView} />;
      case AppView.COMPRESSOR:
        return <Compressor />;
      case AppView.QR_GENERATOR:
        return <QRGenerator />;
      case AppView.DOWNLOADER:
        return <Downloader />;
      case AppView.PROFILE:
        return <Profile />;
      case AppView.UPGRADE:
        return <Upgrade />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return 'CompressQR';
      case AppView.COMPRESSOR: return 'Media Compressor';
      case AppView.QR_GENERATOR: return 'QR Generator';
      case AppView.DOWNLOADER: return 'Universal Downloader';
      case AppView.PROFILE: return 'Profile';
      case AppView.UPGRADE: return 'Pro Plans';
      default: return 'CompressQR';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-gray-800">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu size={24} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
               <div className="text-emerald-500 font-bold text-xl tracking-tight flex items-center gap-1">
                 <span className="text-2xl">⇲</span> CompressQR
               </div>
            </div>
            {/* Desktop Breadcrumb/Title */}
            <h1 className="hidden lg:block text-xl font-semibold text-gray-800 ml-2">
              {getHeaderTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Right side icons removed for cleaner UI */}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8 scroll-smooth pb-10">
          <div className="max-w-4xl mx-auto w-full">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;