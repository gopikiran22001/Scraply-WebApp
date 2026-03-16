import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';

export default function Route() {
    const { id } = useParams();
    const { addToast } = useToast();
    const [pickup, setPickup] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPickup = async () => {
            try {
                const { data } = await api.get(`/pickups/${id}`);
                setPickup(data);
            } catch (error) {
                addToast(getApiErrorMessage(error, 'Error fetching pickup'), 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchPickup();
    }, [id, addToast]);

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    if (!pickup) {
        return <div className="text-center py-12">Pickup not found</div>;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link to="/collector/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>

            <div className="card p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Navigation to Job</h1>
                <p className="text-gray-600">Category: {pickup.category}</p>
            </div>

            <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 pb-8">
                <div className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary-500 ring-4 ring-white"></div>
                    <h3 className="font-bold text-gray-900">Start: Current Location</h3>
                </div>

                <div className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-500 ring-4 ring-white"></div>
                    <h3 className="font-bold text-gray-900">Destination</h3>
                    <p className="text-gray-500 text-sm mt-1">
                        {pickup.address || "Address not available"}
                    </p>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-sm font-medium text-gray-700">Note:</p>
                        <p className="text-sm text-gray-500">Description: {pickup.description}</p>
                    </div>
                </div>
            </div>

            <button className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                <Navigation className="h-5 w-5" /> Arrived at Location
            </button>
        </div>
    );
}
