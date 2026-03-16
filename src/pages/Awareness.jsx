import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Awareness() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Waste Segregation Guide</h1>
                <p className="text-xl text-gray-600">
                    Proper segregation is the first step towards effective recycling. Learn how to separate your waste correctly.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="card p-8 border-t-4 border-t-green-500">
                    <h2 className="text-2xl font-bold text-green-700 mb-6 flex items-center gap-2">
                        <CheckCircle className="h-6 w-6" /> Do's
                    </h2>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                            <span className="text-gray-700">Separate dry and wet waste at the source.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                            <span className="text-gray-700">Rinse plastic containers before disposal.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                            <span className="text-gray-700">Flatten cardboard boxes to save space.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                            <span className="text-gray-700">Wrap broken glass in newspaper before binning.</span>
                        </li>
                    </ul>
                </div>

                <div className="card p-8 border-t-4 border-t-red-500">
                    <h2 className="text-2xl font-bold text-red-700 mb-6 flex items-center gap-2">
                        <XCircle className="h-6 w-6" /> Don'ts
                    </h2>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5"></span>
                            <span className="text-gray-700">Don't mix e-waste with regular garbage.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5"></span>
                            <span className="text-gray-700">Don't throw batteries in the general bin.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5"></span>
                            <span className="text-gray-700">Don't use single-use plastics if avoidable.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5"></span>
                            <span className="text-gray-700">Don't pour oil or grease down the drain.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <img
                    src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop"
                    alt="Recycling"
                    className="rounded-xl h-64 w-full object-cover shadow-md"
                />
                <img
                    src="https://images.unsplash.com/photo-1605600659908-0ef719419d41?q=80&w=2073&auto=format&fit=crop"
                    alt="Segregation"
                    className="rounded-xl h-64 w-full object-cover shadow-md"
                />
                <img
                    src="https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?q=80&w=2071&auto=format&fit=crop"
                    alt="Green City"
                    className="rounded-xl h-64 w-full object-cover shadow-md"
                />
            </div>
        </div>
    );
}
