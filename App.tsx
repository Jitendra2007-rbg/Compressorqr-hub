import React, { useState, useEffect } from 'react';
import { Menu, LayoutDashboard, FileImage, QrCode, Download, User } from 'lucide-react';
import { AppView } from './types';
import Dashboard from './components/Dashboard';
import Compressor from './components/Compressor';
import QRGenerator from './components/QRGenerator';
import Downloader from './components/Downloader';
import Profile from './components/Profile';
import Upgrade from './components/Upgrade';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import FileViewer from './components/FileViewer';
import Footer from './components/Footer';
import About from './components/About';
import Contact from './components/Contact';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import { supabase } from './utils/supabaseClient';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [viewFileId, setViewFileId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'info' | 'error' } | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ msg, type });
  };

  // Check URL for shared file view
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/view/')) {
      const id = path.replace('/view/', '');
      if (id) {
        setViewFileId(id);
        setCurrentView(AppView.FILE_VIEWER);
      }
    }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onViewChange={setCurrentView} />;
      case AppView.COMPRESSOR:
        return <Compressor showToast={showToast} />;
      case AppView.QR_GENERATOR:
        return <QRGenerator showToast={showToast} />;
      case AppView.DOWNLOADER:
        return <Downloader showToast={showToast} />;
      case AppView.PROFILE:
        return <Profile onViewChange={setCurrentView} />;
      case AppView.UPGRADE:
        return <Upgrade />;
      case AppView.AUTH:
        return <Auth onSuccess={() => {
          setCurrentView(AppView.DASHBOARD);
          showToast("Successfully logged in!", "success");
        }} onViewChange={setCurrentView} />;
      case AppView.FILE_VIEWER:
        return viewFileId ? <FileViewer id={viewFileId} onBack={() => {
          window.history.pushState(null, '', '/');
          setCurrentView(AppView.DASHBOARD);
          setViewFileId(null);
        }} /> : <Dashboard onViewChange={setCurrentView} />;
      case AppView.ABOUT: return <About />;
      case AppView.CONTACT: return <Contact />;
      case AppView.PRIVACY: return <Privacy />;
      case AppView.TERMS: return <Terms />;
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
      case AppView.UPGRADE: return 'Pro Plans';
      case AppView.AUTH: return 'Account';
      case AppView.ABOUT: return 'About Us';
      case AppView.CONTACT: return 'Contact';
      case AppView.PRIVACY: return 'Privacy Policy';
      case AppView.TERMS: return 'Terms of Service';
      default: return 'CompressQR';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-gray-800">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-6 py-3 rounded-full shadow-xl text-white text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-600'
            }`}>
            {toast.msg}
          </div>
        </div>
      )}

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
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8 scroll-smooth pb-10">
          <div className="max-w-4xl mx-auto w-full">
            {renderView()}
          </div>
          {/* Footer for standard views */}
          {currentView !== AppView.FILE_VIEWER && <Footer onNavigate={(view) => {
            setCurrentView(view);
            // Scroll to top
            document.querySelector('main')?.scrollTo(0, 0);
          }} />}
        </main>
      </div>
    </div>
  );
};

export default App;