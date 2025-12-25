
import React from 'react';
import { AppView } from '../types';

interface FooterProps {
    onNavigate: (view: AppView) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    return (
        <footer className="mt-12 py-8 border-t border-gray-200 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="font-bold text-gray-800 text-lg mb-1">CompressQR</h3>
                        <p className="text-sm text-gray-500">
                            © {new Date().getFullYear()} All rights reserved.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-600">
                        <button
                            onClick={() => onNavigate(AppView.ABOUT)}
                            className="hover:text-emerald-600 transition-colors"
                        >
                            About Us
                        </button>
                        <button
                            onClick={() => onNavigate(AppView.CONTACT)}
                            className="hover:text-emerald-600 transition-colors"
                        >
                            Contact
                        </button>
                        <button
                            onClick={() => onNavigate(AppView.PRIVACY)}
                            className="hover:text-emerald-600 transition-colors"
                        >
                            Privacy Policy
                        </button>
                        <button
                            onClick={() => onNavigate(AppView.TERMS)}
                            className="hover:text-emerald-600 transition-colors"
                        >
                            Terms of Service
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-gray-400 max-w-2xl mx-auto">
                    Disclaimer: This site acts as a tool for personal use. We do not host copyrighted content.
                    Please respect the intellectual property rights of others when using our services.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
