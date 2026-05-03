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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <Link to="/collector/dashboard" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>

            <div className="card p-6 mb-6 bg-gradient-to-br from-slate-50 to-white border-slate-200">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Navigation to Job</h1>
                <p className="text-slate-600 font-medium">Category: <span className="font-bold text-slate-900">{pickup.category}</span></p>
            </div>

            <div className="relative border-l-4 border-primary-400 ml-4 space-y-6 pb-8">
                <div className="relative pl-8">
                    <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 ring-4 ring-white shadow-md"></div>
                    <h3 className="font-bold text-slate-900 text-lg">Start: Current Location</h3>
                    <p className="text-sm text-slate-500 mt-1">Your current position</p>
                </div>

                <div className="relative pl-8">
                    <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 ring-4 ring-white shadow-md"></div>
                    <h3 className="font-bold text-slate-900 text-lg">Destination</h3>
                    <p className="text-slate-600 text-sm mt-2">
                        📍 {pickup.address || "Address not available"}
                    </p>
                    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
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
