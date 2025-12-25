
import React from 'react';
import { Mail, MessageSquare } from 'lucide-react';

const Contact: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto py-8 space-y-8 text-gray-700">
            <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
            <p className="text-lg text-gray-600">
                Have questions, feedback, or need support? We'd love to hear from you.
            </p>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Email Support</h3>
                        <p className="text-sm text-gray-500">For general inquiries and technical assistance.</p>
                    </div>
                </div>

                <p className="text-xl font-medium text-emerald-600 select-all bg-emerald-50 inline-block px-4 py-2 rounded-lg border border-emerald-100">
                    support@compressorqr.com
                </p>
                <p className="mt-4 text-sm text-gray-400 italic">
                    (Note: This is a demo email. Please replace with your actual contact email for AdSense approval.)
                </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Feedback</h3>
                    </div>
                </div>
                <p className="mb-4">
                    We value your suggestions to make CompressQR better.
                </p>
                <button className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
                    Send Feedback Form
                </button>
            </div>
        </div>
    );
};

export default Contact;
