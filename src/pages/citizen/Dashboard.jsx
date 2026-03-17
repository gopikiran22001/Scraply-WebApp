import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, List, AlertTriangle, Package, Clock3, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';
import { getApiErrorMessage } from '../../utils/apiError';

const ACTIVE_STATUSES = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'];
const STATUS_ORDER = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const STATUS_LABELS = {
    REQUESTED: 'Requested',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
};
const STATUS_BAR_STYLES = {
    REQUESTED: 'bg-slate-400',
    ASSIGNED: 'bg-sky-500',
    IN_PROGRESS: 'bg-amber-500',
    COMPLETED: 'bg-emerald-500',
    CANCELLED: 'bg-rose-500',
};
const CATEGORY_PIE_COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function CitizenDashboard() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [stats, setStats] = useState({
        totalRequests: 0,
        completedPickups: 0,
        activePickups: 0,
        activeReports: 0,
        nextPickup: null,
        latestReport: null,
        requestMix: {
            pickups: 0,
            reports: 0,
        },
        statusBreakdown: {},
        categoryBreakdown: [],
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [{ data: pickups }, { data: reports }] = await Promise.all([
                    api.get('/pickups/'),
                    api.get('/illegals/'),
                ]);

                const safePickups = Array.isArray(pickups) ? pickups : [];
                const safeReports = Array.isArray(reports) ? reports : [];

                const completedPickups = safePickups.filter(p => p.status === 'COMPLETED').length;
                const activePickups = safePickups.filter(p => ACTIVE_STATUSES.includes(p.status)).length;

                const upcomingPickups = safePickups
                    .filter(p => ACTIVE_STATUSES.includes(p.status) && p.requestedAt)
                    .sort((a, b) => new Date(a.requestedAt) - new Date(b.requestedAt));

                const activeReports = safeReports.filter(r => ACTIVE_STATUSES.includes(r.status)).length;
                const latestReport = [...safeReports]
                    .filter((report) => report.reportedAt)
                    .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt))[0] || null;

                const statusBreakdown = [...safePickups, ...safeReports].reduce((accumulator, request) => {
                    const status = String(request.status || 'REQUESTED').toUpperCase();
                    accumulator[status] = (accumulator[status] || 0) + 1;
                    return accumulator;
                }, {});

                const categoryBreakdown = [...safePickups, ...safeReports]
                    .reduce((accumulator, request) => {
                        const category = String(request.category || 'MIXED').toUpperCase();
                        accumulator[category] = (accumulator[category] || 0) + 1;
                        return accumulator;
                    }, {});

                const sortedCategories = Object.entries(categoryBreakdown)
                    .sort((left, right) => right[1] - left[1])
                    .slice(0, 5)
                    .map(([category, count]) => ({ category, count }));

                setStats({
                    totalRequests: safePickups.length + safeReports.length,
                    completedPickups,
                    activePickups,
                    activeReports,
                    nextPickup: upcomingPickups[0] || null,
                    latestReport,
                    requestMix: {
                        pickups: safePickups.length,
                        reports: safeReports.length,
                    },
                    statusBreakdown,
                    categoryBreakdown: sortedCategories,
                });
            } catch (error) {
                addToast(getApiErrorMessage(error, 'Error fetching dashboard data'), 'error');
                setStats({
                    totalRequests: 0,
                    completedPickups: 0,
                    activePickups: 0,
                    activeReports: 0,
                    nextPickup: null,
                    latestReport: null,
                    requestMix: {
                        pickups: 0,
                        reports: 0,
                    },
                    statusBreakdown: {},
                    categoryBreakdown: [],
                });
            }
        };

        if (user) {
            fetchData();
        }
    }, [user, addToast]);

    const totalMixCount = stats.requestMix.pickups + stats.requestMix.reports;
    const categoryTotal = stats.categoryBreakdown.reduce((sum, item) => sum + item.count, 0);
    let pieAccumulator = 0;
    const pieSegments = stats.categoryBreakdown.map((item, index) => {
        const percentage = categoryTotal ? (item.count / categoryTotal) * 100 : 0;
        const start = pieAccumulator;
        const end = start + percentage;
        pieAccumulator = end;

        return {
            ...item,
            percentage,
            color: CATEGORY_PIE_COLORS[index % CATEGORY_PIE_COLORS.length],
            start,
            end,
        };
    });
    const pieGradient = pieSegments.length > 0
        ? `conic-gradient(${pieSegments.map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`).join(', ')})`
        : 'conic-gradient(#e5e7eb 0% 100%)';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
                <p className="text-gray-600 mt-2">A live view of your requests, progress, and waste activity.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
                <div className="card p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none shadow-lg shadow-primary-600/20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <List className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-primary-100 text-sm font-medium">Total Requests</p>
                            <h3 className="text-3xl font-bold">{stats.totalRequests}</h3>
                        </div>
                    </div>
                    <p className="text-sm text-primary-100">Pickups and dump reports combined in one view.</p>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Active Pickups</h3>
                            <p className="text-3xl font-bold text-gray-900">{stats.activePickups}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                            <Package className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Requests that are waiting, assigned, or in progress.</p>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Open Dump Reports</h3>
                            <p className="text-3xl font-bold text-gray-900">{stats.activeReports}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Reported locations still awaiting action.</p>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Completed Pickups</h3>
                            <p className="text-3xl font-bold text-gray-900">{stats.completedPickups}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Completed collections contributing to your impact.</p>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] mb-8">
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Request Mix</h2>
                            <p className="text-sm text-gray-500">How your activity is split between pickups and dump reports.</p>
                        </div>
                        <Link to="/citizen/pickups" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex h-4 overflow-hidden rounded-full bg-white shadow-inner">
                            <div
                                className="bg-primary-500 transition-all"
                                style={{ width: `${totalMixCount ? (stats.requestMix.pickups / totalMixCount) * 100 : 0}%` }}
                            />
                            <div
                                className="bg-orange-400 transition-all"
                                style={{ width: `${totalMixCount ? (stats.requestMix.reports / totalMixCount) * 100 : 0}%` }}
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mt-5">
                            <div className="rounded-xl bg-white p-4 border border-gray-100">
                                <div className="flex items-center gap-2 text-primary-600 mb-2">
                                    <Package className="h-4 w-4" />
                                    <span className="text-sm font-medium">Pickups</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{stats.requestMix.pickups}</div>
                            </div>
                            <div className="rounded-xl bg-white p-4 border border-gray-100">
                                <div className="flex items-center gap-2 text-orange-600 mb-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Dump Reports</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{stats.requestMix.reports}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Breakdown</h3>
                        <div className="space-y-3">
                            {STATUS_ORDER.map((status) => {
                                const count = stats.statusBreakdown[status] || 0;
                                const percentage = stats.totalRequests ? (count / stats.totalRequests) * 100 : 0;

                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between text-sm mb-1.5">
                                            <span className="text-gray-600">{STATUS_LABELS[status]}</span>
                                            <span className="font-medium text-gray-900">{count}</span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${STATUS_BAR_STYLES[status]}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock3 className="h-5 w-5 text-primary-600" />
                            <h2 className="text-lg font-bold text-gray-900">Upcoming Activity</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Next Pickup</p>
                                {stats.nextPickup ? (
                                    <>
                                        <p className="text-lg font-bold text-gray-900">{new Date(stats.nextPickup.requestedAt).toLocaleString()}</p>
                                        <p className="text-sm text-gray-500 mt-1">{stats.nextPickup.category} · {stats.nextPickup.address}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-400">No active pickup scheduled.</p>
                                )}
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Latest Dump Report</p>
                                {stats.latestReport ? (
                                    <>
                                        <p className="text-lg font-bold text-gray-900">{stats.latestReport.category}</p>
                                        <p className="text-sm text-gray-500 mt-1">{stats.latestReport.address}</p>
                                        <p className="text-xs text-gray-400 mt-2">{stats.latestReport.reportedAt ? new Date(stats.latestReport.reportedAt).toLocaleString() : 'N/A'}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-400">No dump reports submitted yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Top Categories</h2>
                        <div className="space-y-4">
                            {stats.categoryBreakdown.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-5 items-center">
                                    <div className="mx-auto sm:mx-0 relative h-36 w-36">
                                        <div
                                            className="h-full w-full rounded-full border border-gray-100"
                                            style={{ background: pieGradient }}
                                        />
                                        <div className="absolute inset-5 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xs text-gray-500 text-center px-2">
                                            {categoryTotal} total
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        {pieSegments.map((segment) => (
                                            <div key={segment.category} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                                                    <span className="text-gray-700 truncate">{segment.category}</span>
                                                </div>
                                                <span className="text-gray-900 font-medium">{segment.count} ({Math.round(segment.percentage)}%)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No category data available yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-6">
                <Link to="/citizen/request" className="card p-6 hover:border-primary-200 hover:bg-primary-50 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <Plus className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Create Request</h3>
                            <p className="text-sm text-gray-500">Choose pickup or dump report</p>
                        </div>
                    </div>
                </Link>

                <Link to="/citizen/pickups" className="card p-6 hover:border-primary-200 hover:bg-primary-50 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200 transition-colors">
                            <List className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">My Requests</h3>
                            <p className="text-sm text-gray-500">Track status, filters, and history</p>
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
