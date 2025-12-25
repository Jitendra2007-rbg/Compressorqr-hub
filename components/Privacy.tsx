
import React from 'react';

const Privacy: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto py-8 space-y-6 text-gray-700">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Introduction</h2>
                <p>
                    Welcome to CompressQR ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                    This Privacy Policy explains what information we collect, how we use it, and your rights when you access our website.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">2. Information We Collect</h2>
                <p>
                    We do not require you to create an account to use most of our tools. However, we may collect:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>uploaded Files:</strong> Files you upload for compression or QR generation are processed temporarily. They are typically deleted automatically after a short period.</li>
                    <li><strong>Usage Data:</strong> We may collect anonymous information about how you use our site to improve our services (e.g., page views, download counts).</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">3. Cookies and Advertising</h2>
                <p>
                    We use cookies to enhance your experience. Furthermore, we use third-party advertising companies, such as **Google AdSense**, to serve ads when you visit our website.
                </p>
                <p className="mt-2">
                    <strong>Google AdSense:</strong> Google may use cookies (including the DoubleClick cookie) to serve ads based on your prior visits to our website or other websites on the Internet.
                    Users may opt-out of the use of the DoubleClick cookie for interest-based advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline">Google Ads Settings</a>.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Third-Party Links</h2>
                <p>
                    Our service may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site.
                    We strongly advise you to review the Privacy Policy of every site you visit.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us via our Contact page.
                </p>
            </section>
        </div>
    );
};

export default Privacy;
