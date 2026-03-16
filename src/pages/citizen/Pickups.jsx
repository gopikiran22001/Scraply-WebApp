import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Clock, CheckCircle, Calendar, XCircle, Package, User } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';

export default function Pickups() {
    const { addToast } = useToast();
    const [pickups, setPickups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPickups = async () => {
            try {
                const { data } = await api.get('/pickups/');
                setPickups(Array.isArray(data) ? data : []);
            } catch (error) {
                addToast(getApiErrorMessage(error, 'Error fetching pickups'), 'error');
                setPickups([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPickups();
    }, [addToast]);

    const getStatusColor = (status) => {
        switch (String(status || '').toUpperCase()) {
            case 'COMPLETED': return 'bg-green-100 text-green-700';
            case 'ASSIGNED': return 'bg-blue-100 text-blue-700';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
            case 'REQUESTED': return 'bg-gray-100 text-gray-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (String(status || '').toUpperCase()) {
            case 'COMPLETED': return <CheckCircle className="h-6 w-6" />;
            case 'CANCELLED': return <XCircle className="h-6 w-6" />;
            default: return <Clock className="h-6 w-6" />;
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Pickups</h1>

            <div className="space-y-4">
                {pickups.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <p className="text-gray-500">No pickups scheduled yet.</p>
                    </div>
                ) : (
                    pickups.map((pickup) => (
                        <div key={pickup.id} className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className={`p-3 rounded-full ${getStatusColor(pickup.status)} bg-opacity-20`}>
                                    {getStatusIcon(pickup.status)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{pickup.category}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Package className="h-4 w-4" />
                                        <span>{pickup.description}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{pickup.requestedAt ? new Date(pickup.requestedAt).toLocaleString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <User className="h-4 w-4" />
                                        <span>{pickup.pickerName || 'Not assigned yet'}</span>
                                    </div>
                                    {pickup.imageUrl && (
                                        <div className="mt-2">
                                            <img src={pickup.imageUrl} alt="Pickup" className="h-16 w-16 object-cover rounded-md border border-gray-200" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(pickup.status)}`}>
                                {String(pickup.status || '').replace('_', ' ')}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
