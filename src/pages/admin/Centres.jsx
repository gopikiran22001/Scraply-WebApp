import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { MapPin, BarChart3 } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';

export default function AdminCentres() {
    const { addToast } = useToast();
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchZoneStats = async () => {
            try {
                const [{ data: pickupsData }, { data: dumpsData }] = await Promise.all([
                    api.get('/pickups/'),
                    api.get('/illegals/'),
                ]);

                const allItems = [
                    ...(Array.isArray(pickupsData) ? pickupsData : []),
                    ...(Array.isArray(dumpsData) ? dumpsData : []),
                ];

                const byPin = allItems.reduce((acc, item) => {
                    const pin = item.pinCode || 'UNKNOWN';
                    acc[pin] = (acc[pin] || 0) + 1;
                    return acc;
                }, {});

                const mapped = Object.entries(byPin)
                    .map(([pinCode, total]) => ({ pinCode, total }))
                    .sort((a, b) => b.total - a.total);

                setZones(mapped);
            } catch (error) {
                addToast(getApiErrorMessage(error, 'Failed to load zone analytics'), 'error');
                setZones([]);
            } finally {
                setLoading(false);
            }
        };

        fetchZoneStats();
    }, [addToast]);

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Zone Load Analytics</h1>
                <p className="text-gray-600">Derived from backend pickup and illegal dumping records by pin code.</p>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Zone (Pin Code)</th>
                                <th className="px-6 py-4">Total Requests/Reports</th>
                                <th className="px-6 py-4">Load Indicator</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {zones.map((zone) => {
                                const load = Math.min(100, zone.total * 10);
                                return (
                                    <tr key={zone.pinCode} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            {zone.pinCode}
                                        </td>
                                        <td className="px-6 py-4">{zone.total}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-full max-w-[180px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${load > 80 ? 'bg-red-500' : load > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                        style={{ width: `${load}%` }}
                                                    ></div>
                                                </div>
                                                <span className="font-medium">{load}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card p-4 mt-6 text-sm text-gray-500 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> No centre management API exists in backend; this view uses available backend signals only.
            </div>
        </div>
    );
}
