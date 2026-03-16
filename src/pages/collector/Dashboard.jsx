import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { CheckCircle, XCircle, Clock, Truck, AlertTriangle } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';

function StatusBadge({ status }) {
    const normalized = String(status || '').toUpperCase();

    if (normalized === 'COMPLETED') {
        return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">COMPLETED</span>;
    }

    if (normalized === 'CANCELLED') {
        return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">CANCELLED</span>;
    }

    if (normalized === 'ASSIGNED') {
        return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">ASSIGNED</span>;
    }

    return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{normalized || 'UNKNOWN'}</span>;
}

export default function CollectorDashboard() {
    const { addToast } = useToast();
    const [pickups, setPickups] = useState([]);
    const [dumps, setDumps] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = useCallback(async () => {
        try {
            const [{ data: pickupData }, { data: dumpData }] = await Promise.all([
                api.get('/pickups/'),
                api.get('/illegals/'),
            ]);

            setPickups(Array.isArray(pickupData) ? pickupData : []);
            setDumps(Array.isArray(dumpData) ? dumpData : []);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to load assigned jobs'), 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const updatePickupStatus = async (pickupId, status) => {
        try {
            await api.put('/pickups/', { id: pickupId, status });
            addToast(`Pickup marked ${status}`, 'success');
            fetchJobs();
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update pickup'), 'error');
        }
    };

    const updateDumpStatus = async (dumpingId, status) => {
        try {
            await api.put('/illegals/', { id: dumpingId, status });
            addToast(`Dump report marked ${status}`, 'success');
            fetchJobs();
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update dump report'), 'error');
        }
    };

    const openPickups = pickups.filter((item) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED');
    const openDumps = dumps.filter((item) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED');

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Picker Dashboard</h1>
                <p className="text-gray-600">{openPickups.length + openDumps.length} active assignments</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Truck className="h-5 w-5" /> Pickup Requests
                    </h2>
                    <div className="space-y-4">
                        {pickups.length === 0 ? (
                            <div className="card p-4 text-gray-500">No pickup assignments.</div>
                        ) : (
                            pickups.map((job) => (
                                <div key={job.id} className="card p-5">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">{job.category}</p>
                                            <p className="text-sm text-gray-600 mt-1">{job.address}</p>
                                            <p className="text-sm text-gray-500 mt-1">{job.description}</p>
                                        </div>
                                        <StatusBadge status={job.status} />
                                    </div>
                                    {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
                                        <div className="flex gap-2 mt-4">
                                            <button onClick={() => updatePickupStatus(job.id, 'COMPLETED')} className="btn btn-primary text-sm flex items-center gap-1">
                                                <CheckCircle className="h-4 w-4" /> Complete
                                            </button>
                                            <button onClick={() => updatePickupStatus(job.id, 'CANCELLED')} className="btn btn-secondary text-sm flex items-center gap-1">
                                                <XCircle className="h-4 w-4" /> Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" /> Illegal Dump Reports
                    </h2>
                    <div className="space-y-4">
                        {dumps.length === 0 ? (
                            <div className="card p-4 text-gray-500">No dumping assignments.</div>
                        ) : (
                            dumps.map((job) => (
                                <div key={job.id} className="card p-5">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">{job.category || 'MIXED'}</p>
                                            <p className="text-sm text-gray-600 mt-1">{job.address}</p>
                                            <p className="text-sm text-gray-500 mt-1">{job.description}</p>
                                        </div>
                                        <StatusBadge status={job.status} />
                                    </div>
                                    {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
                                        <div className="flex gap-2 mt-4">
                                            <button onClick={() => updateDumpStatus(job.id, 'COMPLETED')} className="btn btn-primary text-sm flex items-center gap-1">
                                                <CheckCircle className="h-4 w-4" /> Resolve
                                            </button>
                                            <button onClick={() => updateDumpStatus(job.id, 'CANCELLED')} className="btn btn-secondary text-sm flex items-center gap-1">
                                                <XCircle className="h-4 w-4" /> Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <div className="card p-4 mt-8 text-sm text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Status updates are persisted immediately to backend.
            </div>
        </div>
    );
}
