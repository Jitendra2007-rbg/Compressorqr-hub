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

  // SEO Title Mapping
  const titles: Record<AppView, string> = {
    [AppView.DASHBOARD]: 'CompressorQR Hub – Image Compressor & QR Generator',
    [AppView.COMPRESSOR]: 'Online Image Compressor – Reduce Image Size in KB',
    [AppView.QR_GENERATOR]: 'QR Code Generator – Create and Scan QR Codes Online',
    [AppView.DOWNLOADER]: 'Link Tools – Preview, Shorten and Manage URLs',
    [AppView.PROFILE]: 'User Profile - CompressorQR Hub',
    [AppView.UPGRADE]: 'Upgrade Plans - CompressorQR Hub',
    [AppView.AUTH]: 'Login / Sign Up - CompressorQR Hub',
    [AppView.FILE_VIEWER]: 'File Viewer - CompressorQR Hub',
    [AppView.ABOUT]: 'About CompressorQR Hub',
    [AppView.CONTACT]: 'Contact Us - CompressorQR Hub',
    [AppView.PRIVACY]: 'Privacy Policy - CompressorQR Hub',
    [AppView.TERMS]: 'Terms of Service - CompressorQR Hub',
  };

  const descriptions: Record<AppView, string> = {
    [AppView.DASHBOARD]: 'Online image compressor, QR code generator, and link tools. Compress images, create QR codes, and manage files for free with CompressorQR Hub.',
    [AppView.COMPRESSOR]: 'Use our online image compressor to shrink JPG, PNG and WebP files to specific KB sizes like 10KB, 20KB, 50KB or 100KB.',
    [AppView.QR_GENERATOR]: 'Generate QR codes for links, text, Wi‑Fi or contacts. Download high‑quality QR images for print and social media.',
    [AppView.DOWNLOADER]: 'Analyze and manage links. Inspect URLs, turn them into QR codes, and create clean share links.',
    [AppView.PROFILE]: 'Manage your CompressorQR Hub profile and settings.',
    [AppView.UPGRADE]: 'Upgrade to CompressorQR Hub Pro for more features.',
    [AppView.AUTH]: 'Login or Create an account to save your history.',
    [AppView.FILE_VIEWER]: 'View and download shared files.',
    [AppView.ABOUT]: 'Learn more about CompressorQR Hub tools.',
    [AppView.CONTACT]: 'Get in touch with the CompressorQR Hub team.',
    [AppView.PRIVACY]: 'Privacy Policy for CompressorQR Hub.',
    [AppView.TERMS]: 'Terms of Service for CompressorQR Hub.',
  };

  const routes: Record<string, AppView> = {
    '/': AppView.DASHBOARD,
    '/compressor': AppView.COMPRESSOR,
    '/qr-generator': AppView.QR_GENERATOR,
    '/downloader': AppView.DOWNLOADER,
    '/profile': AppView.PROFILE,
    '/upgrade': AppView.UPGRADE,
    '/auth': AppView.AUTH,
    '/about': AppView.ABOUT,
    '/contact': AppView.CONTACT,
    '/privacy': AppView.PRIVACY,
    '/terms': AppView.TERMS
  };

  const routeReverse: Record<string, string> = Object.fromEntries(
    Object.entries(routes).map(([k, v]) => [v, k])
  );

  // Handle URL on mount and popstate
  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      if (path.startsWith('/view/')) {
        const id = path.replace('/view/', '');
        if (id) {
          setViewFileId(id);
          setCurrentView(AppView.FILE_VIEWER);
        }
      } else {
        // Find view for path (exact match)
        const view = routes[path] || AppView.DASHBOARD;
        setCurrentView(view);
        setViewFileId(null);
      }
    };

    handleNavigation(); // Initial load
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  // Update URL, Title & Meta Description when view changes
  useEffect(() => {
    let title = titles[currentView] || 'CompressorQR Hub';
    let desc = descriptions[currentView] || '';

    // Specialized Logic for Compressor Target URL (e.g., ?target=25kb)
    if (currentView === AppView.COMPRESSOR) {
      const params = new URLSearchParams(window.location.search);
      const target = params.get('target');
      if (target) {
        // Auto-update SEO info for this specific target
        title = `Compress Image to ${target.toUpperCase()} - Online Image Compressor`;
        desc = `Compress your images to exactly ${target.toUpperCase()} online. Fast, free and secure image compression to ${target.toUpperCase()}.`;
      }
    }

    document.title = title;

    // Update Meta Description
    let metaDesc = document.querySelector("meta[name='description']");
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    // Update URL if not already matching (to avoid creating history on popstate)
    const targetPath = currentView === AppView.FILE_VIEWER
      ? (viewFileId ? `/view/${viewFileId}` : '/')
      : (routeReverse[currentView] || '/');

    // Preserve query params if on Compressor
    const search = (currentView === AppView.COMPRESSOR) ? window.location.search : '';
    const fullPath = targetPath + search;

    if (window.location.pathname + window.location.search !== fullPath) {
      window.history.pushState(null, '', fullPath);
    }
  }, [currentView, viewFileId]);

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