import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
    Truck,
    AlertTriangle,
    CheckCircle,
    Clock,
    BarChart3,
} from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';

export default function AdminDashboard() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPickups: 0,
        totalReports: 0,
        openPickups: 0,
        openReports: 0,
        completedPickups: 0,
        completedReports: 0,
    });
    const [categoryBreakdown, setCategoryBreakdown] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [{ data: pickupsData }, { data: reportsData }] = await Promise.all([
                    api.get('/pickups/'),
                    api.get('/illegals/'),
                ]);

                const pickups = Array.isArray(pickupsData) ? pickupsData : [];
                const reports = Array.isArray(reportsData) ? reportsData : [];

                const openStatuses = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'];

                const pickupCategoryCount = pickups.reduce((acc, item) => {
                    const key = item.category || 'UNKNOWN';
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {});

                setCategoryBreakdown(pickupCategoryCount);
                setStats({
                    totalPickups: pickups.length,
                    totalReports: reports.length,
                    openPickups: pickups.filter((p) => openStatuses.includes(p.status)).length,
                    openReports: reports.filter((r) => openStatuses.includes(r.status)).length,
                    completedPickups: pickups.filter((p) => p.status === 'COMPLETED').length,
                    completedReports: reports.filter((r) => r.status === 'COMPLETED').length,
                });
            } catch (error) {
                addToast(getApiErrorMessage(error, 'Failed to load admin dashboard data'), 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [addToast]);

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600">Live metrics from pickup and illegal dump APIs</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm text-gray-500">Total Pickups</h3>
                            <Truck className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalPickups}</p>
                    </div>
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm text-gray-500">Total Dump Reports</h3>
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalReports}</p>
                    </div>
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm text-gray-500">Open Pickups</h3>
                            <Clock className="h-5 w-5 text-yellow-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.openPickups}</p>
                    </div>
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm text-gray-500">Open Dump Reports</h3>
                            <Clock className="h-5 w-5 text-red-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.openReports}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" /> Completion Snapshot
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Completed Pickups</span>
                                <span className="font-semibold text-gray-900">{stats.completedPickups}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Completed Dump Reports</span>
                                <span className="font-semibold text-gray-900">{stats.completedReports}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary-600" /> Pickup Category Distribution
                        </h3>
                        {Object.keys(categoryBreakdown).length === 0 ? (
                            <p className="text-gray-500">No pickup data available.</p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(categoryBreakdown).map(([category, count]) => (
                                    <div key={category} className="flex justify-between items-center">
                                        <span className="text-gray-700">{category}</span>
                                        <span className="font-semibold text-gray-900">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
