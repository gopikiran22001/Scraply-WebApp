import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="bg-red-50 p-4 rounded-full mb-6">
                <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-8 max-w-md">
                Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
            </p>
            <Link to="/" className="btn btn-primary flex items-center gap-2">
                <Home className="h-5 w-5" /> Back to Home
            </Link>
        </div>
    );
}
