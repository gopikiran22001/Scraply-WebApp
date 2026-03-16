import React from 'react';
import { Recycle } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <div className="bg-primary-100 p-2 rounded-lg">
                            <Recycle className="h-6 w-6 text-primary-600" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Scraply</span>
                    </div>
                    <div className="text-gray-500 text-sm">
                        © 2026 Scraply Waste Management. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
