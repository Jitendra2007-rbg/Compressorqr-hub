
import React from 'react';

const Terms: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto py-8 space-y-6 text-gray-700">
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h2>
                <p>
                    By accessing and using CompressQR, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">2. Use of Services</h2>
                <p>
                    Our tools (Compressor, QR Generator, Downloader) are provided for personal and non-commercial use. You agree not to use these services for any illegal purpose.
                </p>
            </section>

            <section className="bg-red-50 p-4 rounded-lg border border-red-100">
                <h2 className="text-xl font-semibold text-red-800 mb-2">3. Copyright and Intellectual Property</h2>
                <p className="text-red-700">
                    **Strict Policy:** You typically must own the copyright or have the necessary permissions for any content you process, upload, or download using our tools.
                </p>
                <p className="mt-2 text-red-700">
                    Our "Downloader" tool is intended solely for downloading:
                </p>
                <ul className="list-disc pl-5 mt-1 text-red-700 space-y-1">
                    <li>Content you own.</li>
                    <li>Content that is in the Public Domain.</li>
                    <li>Content licensed under Creative Commons that allows downloading.</li>
                </ul>
                <p className="mt-2 text-red-700 font-medium">
                    We strictly prohibit the downloading of copyrighted material (e.g., music videos, movies) without the copyright holder's permission. We assume no liability for misuse of our services.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Disclaimer of Warranties</h2>
                <p>
                    The services are provided "as is". We do not warrant that the website will be uninterrupted or error-free. We disclaim all warranties, express or implied.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Changes to Terms</h2>
                <p>
                    We reserve the right to modify these terms at any time. Your continued use of the site constitutes acceptance of those changes.
                </p>
            </section>
        </div>
    );
};

export default Terms;
