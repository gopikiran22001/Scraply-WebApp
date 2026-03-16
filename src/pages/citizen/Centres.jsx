import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { MapPin, Clock, AlertTriangle, Truck } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';

export default function Centres() {
    const { addToast } = useToast();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const [{ data: pickupsData }, { data: dumpsData }] = await Promise.all([
                    api.get('/pickups/'),
                    api.get('/illegals/'),
                ]);

                const pickupLocations = (Array.isArray(pickupsData) ? pickupsData : []).map((item) => ({
                    id: `pickup-${item.id}`,
                    type: 'PICKUP',
                    address: item.address,
                    status: item.status,
                    updatedAt: item.requestedAt,
                }));

                const dumpLocations = (Array.isArray(dumpsData) ? dumpsData : []).map((item) => ({
                    id: `dump-${item.id}`,
                    type: 'DUMP_REPORT',
                    address: item.address,
                    status: item.status,
                    updatedAt: item.reportedAt,
                }));

                setLocations([...pickupLocations, ...dumpLocations]);
            } catch (error) {
                addToast(getApiErrorMessage(error, 'Failed to load area data'), 'error');
                setLocations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, [addToast]);

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Area Activity</h1>
            <p className="text-gray-600 mb-6">Live location feed from pickup requests and dump reports.</p>

            <div className="grid md:grid-cols-2 gap-6">
                {locations.map((item) => (
                    <div key={item.id} className="card p-6 hover:border-primary-300 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    {item.type === 'PICKUP' ? <Truck className="h-5 w-5 text-blue-500" /> : <AlertTriangle className="h-5 w-5 text-orange-500" />}
                                    {item.type === 'PICKUP' ? 'Pickup Location' : 'Dump Report Location'}
                                </h3>
                                <p className="text-gray-500 text-sm flex items-center gap-1 mt-2">
                                    <MapPin className="h-4 w-4" /> {item.address || 'Address unavailable'}
                                </p>
                            </div>
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                {item.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Unknown time'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
