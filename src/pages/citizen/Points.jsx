import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Award, TrendingUp, ListChecks, AlertTriangle } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';

export default function Points() {
    const { addToast } = useToast();
    const [summary, setSummary] = useState({
        completedPickups: 0,
        activePickups: 0,
        completedReports: 0,
        activeReports: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const { data: pickups } = await api.get('/pickups/');
            const safePickups = Array.isArray(pickups) ? pickups : [];
            const { data: illegals } = await api.get('/illegals/');
            const safeIllegals = Array.isArray(illegals) ? illegals : [];

            setSummary({
                completedPickups: safePickups.filter((p) => p.status === 'COMPLETED').length,
                activePickups: safePickups.filter((p) => ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'].includes(p.status)).length,
                completedReports: safeIllegals.filter((r) => r.status === 'COMPLETED').length,
                activeReports: safeIllegals.filter((r) => ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length,
            });
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to load progress data'), 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white mb-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <p className="text-primary-100 font-medium mb-1">Sustainability Progress</p>
                        <h1 className="text-5xl font-bold">{summary.completedPickups + summary.completedReports}</h1>
                        <p className="text-sm text-primary-200 mt-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Completed citizen actions
                        </p>
                    </div>
                    <div className="bg-white/20 px-4 py-2 rounded-xl text-sm">
                        Based on live backend statuses
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Breakdown</h2>
            <div className="card divide-y divide-gray-100">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-900">Completed Pickups</span>
                    </div>
                    <span className="font-bold text-green-700">{summary.completedPickups}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ListChecks className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Active Pickups</span>
                    </div>
                    <span className="font-bold text-blue-700">{summary.activePickups}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-emerald-600" />
                        <span className="font-medium text-gray-900">Completed Dump Reports</span>
                    </div>
                    <span className="font-bold text-emerald-700">{summary.completedReports}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-gray-900">Active Dump Reports</span>
                    </div>
                    <span className="font-bold text-orange-700">{summary.activeReports}</span>
                </div>
            </div>
        </div>
    );
}
