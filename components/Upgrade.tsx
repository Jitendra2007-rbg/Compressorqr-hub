import React from 'react';
import { Check, Star, Zap, Shield } from 'lucide-react';

const Upgrade: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-900">Upgrade to Pro</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Get unlimited access to high-quality downloads, batch compression, and priority processing speed.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
        {/* Free Plan */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
          <div className="text-4xl font-bold text-gray-900 mb-6">$0<span className="text-base font-normal text-gray-500">/mo</span></div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-gray-600">
              <Check size={20} className="text-emerald-500" /> Standard Compression
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <Check size={20} className="text-emerald-500" /> 720p Video Downloads
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <Check size={20} className="text-emerald-500" /> Basic QR Codes
            </li>
            <li className="flex items-center gap-3 text-gray-400">
              <Check size={20} className="text-gray-300" /> Bulk Processing
            </li>
          </ul>
          <button className="w-full py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-white p-8 rounded-2xl border-2 border-emerald-500 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
            RECOMMENDED
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Pro Access</h3>
          <div className="text-4xl font-bold text-gray-900 mb-6">$9<span className="text-base font-normal text-gray-500">/mo</span></div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-gray-800 font-medium">
              <div className="p-1 bg-emerald-100 rounded-full text-emerald-600"><Zap size={14} /></div>
              Ultra-Fast 4K Downloads
            </li>
            <li className="flex items-center gap-3 text-gray-800 font-medium">
              <div className="p-1 bg-emerald-100 rounded-full text-emerald-600"><Shield size={14} /></div>
              Lossless Compression
            </li>
            <li className="flex items-center gap-3 text-gray-800 font-medium">
              <div className="p-1 bg-emerald-100 rounded-full text-emerald-600"><Star size={14} /></div>
              Unlimited Batch Processing
            </li>
            <li className="flex items-center gap-3 text-gray-800 font-medium">
              <div className="p-1 bg-emerald-100 rounded-full text-emerald-600"><Check size={14} /></div>
              Custom QR Branding
            </li>
          </ul>
          <button className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all active:scale-95">
            Upgrade Now
          </button>
        </div>
      </div>

      <div className="mt-12 bg-emerald-50 rounded-2xl p-8 text-center">
         <h4 className="font-bold text-emerald-800 mb-2">Need Enterprise Solutions?</h4>
         <p className="text-emerald-600 mb-4">API access and team management features available.</p>
         <button className="text-emerald-700 font-semibold underline hover:text-emerald-800">Contact Sales</button>
      </div>
    </div>
  );
};

export default Upgrade;