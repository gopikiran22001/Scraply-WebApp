import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, List, MapPin, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';
import { getApiErrorMessage } from '../../utils/apiError';

export default function CitizenDashboard() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [stats, setStats] = useState({
        completedPickups: 0,
        activePickups: 0,
        activeReports: 0,
        nextPickup: null,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: pickups } = await api.get('/pickups/');
                const safePickups = Array.isArray(pickups) ? pickups : [];

                const completedPickups = safePickups.filter(p => p.status === 'COMPLETED').length;
                const activePickups = safePickups.filter(p => ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'].includes(p.status)).length;

                const upcomingPickups = safePickups
                    .filter(p => ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'].includes(p.status) && p.requestedAt)
                    .sort((a, b) => new Date(a.requestedAt) - new Date(b.requestedAt));

                const { data: reports } = await api.get('/illegals/');
                const safeReports = Array.isArray(reports) ? reports : [];
                const activeReports = safeReports.filter(r => ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length;

                setStats({
                    completedPickups,
                    activePickups,
                    activeReports,
                    nextPickup: upcomingPickups[0] || null
                });
            } catch (error) {
                addToast(getApiErrorMessage(error, 'Error fetching dashboard data'), 'error');
                setStats({
                    completedPickups: 0,
                    activePickups: 0,
                    activeReports: 0,
                    nextPickup: null
                });
            }
        };

        if (user) {
            fetchData();
        }
    }, [user, addToast]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
                <p className="text-gray-600 mt-2">Here's what's happening with your recycling impact.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="card p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <List className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-primary-100 text-sm font-medium">Completed Pickups</p>
                            <h3 className="text-3xl font-bold">{stats.completedPickups}</h3>
                        </div>
                    </div>
                    <Link to="/citizen/pickups" className="text-sm text-primary-100 hover:text-white underline">View Pickup History</Link>
                </div>

                <div className="card p-6">
                    <h3 className="text-gray-500 text-sm font-medium mb-1">Active Pickups</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.activePickups}</p>
                    <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[55%]"></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Live status from backend queue</p>
                </div>

                <div className="card p-6">
                    <h3 className="text-gray-500 text-sm font-medium mb-1">Open Dump Reports</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeReports}</p>
                    <Link to="/citizen/report-dump" className="mt-4 inline-block text-sm text-primary-600 font-medium hover:text-primary-700">Report a New Spot</Link>
                </div>
            </div>

            <div className="card p-6 mb-8">
                <h3 className="text-gray-500 text-sm font-medium mb-2">Next Pickup</h3>
                    {stats.nextPickup ? (
                        <>
                            <p className="text-xl font-bold text-gray-900">{new Date(stats.nextPickup.requestedAt).toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{stats.nextPickup.category} - {stats.nextPickup.address}</p>
                        </>
                    ) : (
                        <p className="text-xl font-bold text-gray-400">No scheduled pickups</p>
                    )}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-6">
                <Link to="/citizen/request-pickup" className="card p-6 hover:border-primary-200 hover:bg-primary-50 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <Plus className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Request Pickup</h3>
                            <p className="text-sm text-gray-500">Schedule a new collection</p>
                        </div>
                    </div>
                </Link>

                <Link to="/citizen/pickups" className="card p-6 hover:border-primary-200 hover:bg-primary-50 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200 transition-colors">
                            <List className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">View Pickups</h3>
                            <p className="text-sm text-gray-500">Track status & history</p>
                        </div>
                    </div>
                </Link>

                <Link to="/citizen/centres" className="card p-6 hover:border-primary-200 hover:bg-primary-50 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-200 transition-colors">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Area Info</h3>
                            <p className="text-sm text-gray-500">View nearby sustainability data</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
