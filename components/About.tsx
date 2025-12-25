
import React from 'react';

const About: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto py-8 space-y-6 text-gray-700">
            <h1 className="text-3xl font-bold text-gray-900">About Us</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
                Welcome to <strong>CompressQR</strong>, your all-in-one digital utility hub.
                We are dedicated to providing simple, fast, and free tools to help you manage your digital media.
            </p>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Our Mission</h2>
                <p>
                    In a world where digital content is expanding rapidly, managing file sizes and sharing content shouldn't be a hassle.
                    Our mission is to democratize access to high-quality compression and sharing tools without the need for expensive software or complex registrations.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">What We Offer</h2>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <h3 className="font-bold text-emerald-800 mb-2">Smart Compression</h3>
                        <p className="text-sm">Reduce image and video file sizes significantly without losing quality, perfect for web uploads and storage.</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <h3 className="font-bold text-emerald-800 mb-2">QR Generation</h3>
                        <p className="text-sm">Instantly create QR codes for links, text, or even files. Share your digital world with a simple scan.</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <h3 className="font-bold text-emerald-800 mb-2">Universal Downloader</h3>
                        <p className="text-sm">Backup your personal content from various social platforms with our easy-to-use downloader.</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Reach Out</h2>
                <p>
                    We are constantly improving. If you have any feedback or suggestions, please verify via our Contact page.
                    Thank you for choosing CompressQR!
                </p>
            </section>
        </div>
    );
};

export default About;
