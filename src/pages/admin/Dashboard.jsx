import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import {
    Truck,
    AlertTriangle,
    CheckCircle,
    Clock,
    BarChart3,
    RefreshCw,
    Gauge,
    Activity,
    Flame,
    CalendarRange,
    Calendar,
} from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';
import ListboxSelect from '../../components/ListboxSelect';
import AdminTrendChart from '../../components/admin/AdminTrendChart';
import AdminQuickActions from '../../components/admin/AdminQuickActions';
import AdminDonutChart from '../../components/admin/AdminDonutChart';
import AdminBarListChart from '../../components/admin/AdminBarListChart';
import { format, parseISO, startOfWeek, startOfMonth, subDays } from 'date-fns';

const OPEN_STATUSES = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'];
const CENTRE_NOTES_STORAGE_KEY = 'scraply_admin_centre_notes';
const ESCALATION_FLAGS_STORAGE_KEY = 'scraply_admin_escalation_flags';

const ratio = (numerator, denominator) => {
    if (!denominator) {
        return 0;
    }

    return Math.round((numerator / denominator) * 100);
};

export default function AdminDashboard() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [pickups, setPickups] = useState([]);
    const [reports, setReports] = useState([]);
    const [pickers, setPickers] = useState([]);
    const [trendMode, setTrendMode] = useState('WEEKLY');
    // Set date range to current month (1st of month to today)
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const fetchData = useCallback(async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            console.log('[Dashboard] Fetching data from APIs...');
            const [pickupsResponse, reportsResponse, pickersResponse] = await Promise.all([
                api.get('/pickups/'),
                api.get('/illegals/'),
                api.get('/auth/pickers'),
            ]);

            const pickupsData = pickupsResponse?.data;
            const reportsData = reportsResponse?.data;
            const pickersData = pickersResponse?.data;

            console.log('[Dashboard] API Responses received:');
            console.log('  /pickups/ response type:', typeof pickupsData, 'is array:', Array.isArray(pickupsData));
            console.log('  /illegals/ response type:', typeof reportsData, 'is array:', Array.isArray(reportsData));
            console.log('  /auth/pickers response type:', typeof pickersData, 'is array:', Array.isArray(pickersData));

            const pickups = Array.isArray(pickupsData) ? pickupsData : [];
            const reports = Array.isArray(reportsData) ? reportsData : [];
            const pickersList = Array.isArray(pickersData) ? pickersData : [];

            console.log('[Dashboard] Parsed Data:');
            console.log(`  Pickups: ${pickups.length} items`);
            if (pickups.length > 0) {
                console.log('  First pickup:', pickups[0]);
            } else {
                console.warn('  ⚠️ No pickups returned from API');
            }
            
            console.log(`  Reports: ${reports.length} items`);
            if (reports.length > 0) {
                console.log('  First report:', reports[0]);
            } else {
                console.warn('  ⚠️ No reports returned from API');
            }
            
            console.log(`  Pickers: ${pickersList.length} items`);

            setPickups(pickups);
            setReports(reports);
            setPickers(pickersList);
            setLastSyncedAt(new Date());
            
            if (pickups.length === 0 && reports.length === 0) {
                console.warn('[Dashboard] ⚠️ Both pickups and reports are empty - check database or API');
            }
        } catch (error) {
            console.error('[Dashboard] API Error:', error);
            console.error('  Error message:', error.message);
            console.error('  Error response:', error.response?.data);
            console.error('  Error status:', error.response?.status);
            addToast(getApiErrorMessage(error, 'Failed to load admin dashboard data'), 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const inDateRange = useCallback((inputDate) => {
        if (!inputDate) {
            return false;
        }

        const current = typeof inputDate === 'string' ? new Date(inputDate) : inputDate;
        if (!(current instanceof Date) || Number.isNaN(current.getTime())) {
            console.warn('[Dashboard] Invalid date:', { inputDate, parsed: current });
            return false;
        }

        const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const to = endDate ? new Date(`${endDate}T23:59:59`) : null;

        const passesFilter = (from ? current >= from : true) && (to ? current <= to : true);
        
        if (!passesFilter && inputDate) {
            console.warn('[Dashboard] Date filtered out:', {
                inputDate,
                parsed: current.toISOString(),
                from: from?.toISOString(),
                to: to?.toISOString(),
            });
        }

        return passesFilter;
    }, [startDate, endDate]);

    const getPickupDate = useCallback((item) => {
        return item?.requestedAt || item?.createdAt || item?.updatedAt || null;
    }, []);

    const getReportDate = useCallback((item) => {
        return item?.reportedAt || item?.createdAt || item?.updatedAt || null;
    }, []);

    const filteredPickups = useMemo(() => {
        const result = pickups.filter((item) => inDateRange(getPickupDate(item)));
        console.log('[Dashboard] Filtering pickups:', {
            total: pickups.length,
            afterDateFilter: result.length,
            dateRange: { startDate, endDate },
            samplePickupDates: pickups.slice(0, 3).map(p => ({
                id: p.id,
                requestedAt: p.requestedAt,
                createdAt: p.createdAt,
                dateUsed: getPickupDate(p),
            })),
        });
        return result;
    }, [getPickupDate, inDateRange, pickups, startDate, endDate]);

    const filteredReports = useMemo(() => {
        const result = reports.filter((item) => inDateRange(getReportDate(item)));
        console.log('[Dashboard] Filtering reports:', {
            total: reports.length,
            afterDateFilter: result.length,
            dateRange: { startDate, endDate },
            sampleReportDates: reports.slice(0, 3).map(r => ({
                id: r.id,
                reportedAt: r.reportedAt,
                createdAt: r.createdAt,
                dateUsed: getReportDate(r),
            })),
        });
        return result;
    }, [getReportDate, inDateRange, reports, startDate, endDate]);

    const stats = useMemo(() => ({
        totalPickups: filteredPickups.length,
        totalReports: filteredReports.length,
        openPickups: filteredPickups.filter((p) => OPEN_STATUSES.includes(p.status)).length,
        openReports: filteredReports.filter((r) => OPEN_STATUSES.includes(r.status)).length,
        completedPickups: filteredPickups.filter((p) => p.status === 'COMPLETED').length,
        completedReports: filteredReports.filter((r) => r.status === 'COMPLETED').length,
    }), [filteredPickups, filteredReports]);

    const categoryBreakdown = useMemo(() => {
        return filteredPickups.reduce((acc, item) => {
            const key = item.category || 'UNKNOWN';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }, [filteredPickups]);

    const zoneBreakdown = useMemo(() => {
        const zoneCount = [...filteredPickups, ...filteredReports].reduce((acc, item) => {
            const pinCode = item.pinCode || 'UNKNOWN';
            acc[pinCode] = (acc[pinCode] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(zoneCount)
            .map(([pinCode, total]) => ({ pinCode, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [filteredPickups, filteredReports]);

    const topCategories = useMemo(() => (
        Object.entries(categoryBreakdown)
            .sort(([, left], [, right]) => right - left)
            .slice(0, 5)
    ), [categoryBreakdown]);

    const pickerOptions = useMemo(() => {
        return pickers.map((picker) => ({
            id: picker.id,
            name: picker.name,
            phone: picker.phone || '',
        })).sort((left, right) => left.name.localeCompare(right.name));
    }, [pickers]);

    const requestTypeChartData = useMemo(() => {
        return [
            { label: 'Pickups', value: stats.totalPickups, color: '#0ea5e9' },
            { label: 'Dumps', value: stats.totalReports, color: '#f59e0b' },
        ];
    }, [stats.totalPickups, stats.totalReports]);

    const categoryChartRows = useMemo(() => {
        return topCategories.map(([label, value], index) => ({
            label,
            value,
            color: ['#06b6d4', '#22c55e', '#6366f1', '#f59e0b', '#ef4444'][index % 5],
        }));
    }, [topCategories]);

    const hotspotRows = useMemo(() => {
        return zoneBreakdown.map((zone, index) => ({
            label: `Pin ${zone.pinCode}`,
            value: zone.total,
            color: ['#ef4444', '#f97316', '#f59e0b', '#0ea5e9', '#14b8a6'][index % 5],
        }));
    }, [zoneBreakdown]);

    const trendData = useMemo(() => {
        const buckets = new Map();

        const getBucket = (value) => {
            const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
            if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
                return null;
            }

            if (trendMode === 'MONTHLY') {
                const start = startOfMonth(parsed);
                return {
                    key: format(start, 'yyyy-MM'),
                    label: format(start, 'MMM yy'),
                };
            }

            const start = startOfWeek(parsed, { weekStartsOn: 1 });
            return {
                key: format(start, 'yyyy-MM-dd'),
                label: format(start, 'dd MMM'),
            };
        };

        filteredPickups.forEach((item) => {
            const bucket = getBucket(getPickupDate(item));
            if (!bucket) {
                return;
            }

            if (!buckets.has(bucket.key)) {
                buckets.set(bucket.key, {
                    bucket: bucket.key,
                    label: bucket.label,
                    pickups: 0,
                    reports: 0,
                });
            }

            buckets.get(bucket.key).pickups += 1;
        });

        filteredReports.forEach((item) => {
            const bucket = getBucket(getReportDate(item));
            if (!bucket) {
                return;
            }

            if (!buckets.has(bucket.key)) {
                buckets.set(bucket.key, {
                    bucket: bucket.key,
                    label: bucket.label,
                    pickups: 0,
                    reports: 0,
                });
            }

            buckets.get(bucket.key).reports += 1;
        });

        return Array.from(buckets.values())
            .sort((left, right) => left.bucket.localeCompare(right.bucket))
            .slice(-10);
    }, [filteredPickups, filteredReports, getPickupDate, getReportDate, trendMode]);

    const totalItems = stats.totalPickups + stats.totalReports;
    const openItems = stats.openPickups + stats.openReports;
    const completedItems = stats.completedPickups + stats.completedReports;
    const completionRate = ratio(completedItems, totalItems);
    const pendingRate = ratio(openItems, totalItems);

    const handleAssignmentAction = async (payload) => {
        try {
            if (!payload?.pickerId) {
                addToast('Please select a picker for assignment', 'error');
                return;
            }

            if (payload.requestType === 'PICKUP') {
                await api.put('/pickups/', {
                    id: payload.requestId,
                    status: 'ASSIGNED',
                    assignedTo: payload.pickerId,
                });
            } else {
                await api.put('/illegals/', {
                    id: payload.requestId,
                    status: 'ASSIGNED',
                    assignedTo: payload.pickerId,
                });
            }

            addToast(`Assignment created and request marked ASSIGNED to ${payload.pickerName || 'picker'}`, 'success');
            fetchData(true);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to create assignment'), 'error');
        }
    };

    const handleCentreNoteAction = async (payload) => {
        try {
            const previous = JSON.parse(localStorage.getItem(CENTRE_NOTES_STORAGE_KEY) || '[]');
            const next = [{
                ...payload,
                createdAt: new Date().toISOString(),
            }, ...(Array.isArray(previous) ? previous : [])].slice(0, 50);
            localStorage.setItem(CENTRE_NOTES_STORAGE_KEY, JSON.stringify(next));
            addToast('Centre note created', 'success');
        } catch {
            addToast('Centre note saved for this session only', 'info');
        }
    };

    const handleEscalationAction = async (payload) => {
        try {
            const previous = JSON.parse(localStorage.getItem(ESCALATION_FLAGS_STORAGE_KEY) || '[]');
            const next = [{
                ...payload,
                createdAt: new Date().toISOString(),
            }, ...(Array.isArray(previous) ? previous : [])].slice(0, 50);
            localStorage.setItem(ESCALATION_FLAGS_STORAGE_KEY, JSON.stringify(next));
            addToast('Escalation flag created', 'success');
        } catch {
            addToast('Escalation stored for this session only', 'info');
        }
    };

    if (loading) {
        return (
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="admin-shell p-6 sm:p-8 animate-pulse">
                    <div className="h-8 w-72 bg-slate-200 rounded mb-4"></div>
                    <div className="h-4 w-80 bg-slate-100 rounded mb-8"></div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="h-28 rounded-2xl bg-slate-100 border border-slate-200"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="admin-shell p-6 sm:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Admin Command Center</h1>
                        <p className="text-slate-600 mt-1">Live pickup and illegal dump activity across the city.</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span className="admin-chip">Completion {completionRate}%</span>
                            <span className="admin-chip">Pending {pendingRate}%</span>
                            <span className="admin-chip">Open workload {openItems}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2">
                        <button
                            type="button"
                            className="btn btn-primary inline-flex items-center gap-2"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                        <p className="text-xs text-slate-500">
                            Last synced: {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Not available'}
                        </p>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="grid gap-4 lg:grid-cols-2 mb-4">
                        {/* Date Range Filter Card */}
                        <div className="card p-5 border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                            <div className="flex items-center gap-2 mb-4">
                                <CalendarRange className="h-5 w-5 text-primary-600" />
                                <h3 className="font-semibold text-slate-900">Date Range</h3>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">From</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                            value={startDate}
                                            onChange={(event) => setStartDate(event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">To</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                            value={endDate}
                                            onChange={(event) => setEndDate(event.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                {/* Quick filter buttons */}
                                <div>
                                    <p className="text-xs font-medium text-slate-600 mb-2">Quick filters</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEndDate(format(new Date(), 'yyyy-MM-dd'));
                                                setStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
                                            }}
                                            className="px-2 py-1.5 text-xs font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                                        >
                                            7 days
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEndDate(format(new Date(), 'yyyy-MM-dd'));
                                                setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
                                            }}
                                            className="px-2 py-1.5 text-xs font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                                        >
                                            30 days
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEndDate(format(new Date(), 'yyyy-MM-dd'));
                                                setStartDate(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
                                            }}
                                            className="px-2 py-1.5 text-xs font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                                        >
                                            90 days
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEndDate(format(new Date(), 'yyyy-MM-dd'));
                                                setStartDate(format(subDays(new Date(), 365), 'yyyy-MM-dd'));
                                            }}
                                            className="px-2 py-1.5 text-xs font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                                        >
                                            1 year
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Trend Mode Card */}
                        <div className="card p-5 border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="h-5 w-5 text-primary-600" />
                                <h3 className="font-semibold text-slate-900">Analysis Mode</h3>
                            </div>
                            
                            <div className="space-y-3">
                                <p className="text-xs text-slate-600">Select how you want to visualize trends:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTrendMode('WEEKLY')}
                                        className={`px-4 py-2.5 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 border-2 ${
                                            trendMode === 'WEEKLY'
                                                ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                                                : 'bg-white text-slate-700 border-slate-300 hover:border-primary-400'
                                        }`}
                                    >
                                        <Activity className="h-4 w-4" />
                                        Weekly
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTrendMode('MONTHLY')}
                                        className={`px-4 py-2.5 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 border-2 ${
                                            trendMode === 'MONTHLY'
                                                ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                                                : 'bg-white text-slate-700 border-slate-300 hover:border-primary-400'
                                        }`}
                                    >
                                        <Calendar className="h-4 w-4" />
                                        Monthly
                                    </button>
                                </div>
                                
                                <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                                    <p className="text-xs text-primary-700 font-medium">
                                        {trendMode === 'WEEKLY' 
                                            ? '📊 Displaying weekly trends - Great for identifying short-term patterns'
                                            : '📈 Displaying monthly trends - Great for identifying long-term patterns'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-200 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-primary-500 rounded-full"></span>
                        All KPIs, hotspots, and charts are filtered by the selected date range
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="admin-kpi-card">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm text-slate-600">Total Pickups</h3>
                            <Truck className="h-5 w-5 text-secondary-700" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.totalPickups}</p>
                        <p className="text-xs text-slate-500 mt-2">Citizen pickup requests received</p>
                    </div>
                    <div className="admin-kpi-card">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm text-slate-600">Total Dump Reports</h3>
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.totalReports}</p>
                        <p className="text-xs text-slate-500 mt-2">Illegal dumping complaints logged</p>
                    </div>
                    <div className="admin-kpi-card">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm text-slate-600">Open Pickups</h3>
                            <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.openPickups}</p>
                        <p className="text-xs text-slate-500 mt-2">Requests waiting assignment or completion</p>
                    </div>
                    <div className="admin-kpi-card">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm text-slate-600">Open Dump Reports</h3>
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.openReports}</p>
                        <p className="text-xs text-slate-500 mt-2">Hotspots still requiring cleanup</p>
                    </div>
                </div>

                {pickups.length === 0 && reports.length === 0 && (
                    <div className="mb-8 p-6 rounded-xl border border-amber-200 bg-amber-50">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900 mb-2">No data available</h3>
                                <p className="text-sm text-amber-800 mb-3">
                                    The dashboard shows no pickups or dump reports. This could mean:
                                </p>
                                <ul className="text-sm text-amber-800 space-y-1 mb-4">
                                    <li>• <strong>No test data:</strong> Create pickup/dump requests from the citizen or collector app</li>
                                    <li>• <strong>Not authenticated:</strong> Check console for authorization errors (look for [Axios] logs)</li>
                                    <li>• <strong>API not connected:</strong> Verify backend is running on port 8080</li>
                                    <li>• <strong>Session expired:</strong> Try logging out and back in</li>
                                </ul>
                                <details className="text-xs text-amber-700">
                                    <summary className="cursor-pointer font-medium hover:text-amber-800">View troubleshooting info</summary>
                                    <div className="mt-2 p-3 bg-white rounded border border-amber-100 font-mono text-xs">
                                        <div>Pickups loaded: {pickups.length}</div>
                                        <div>Reports loaded: {reports.length}</div>
                                        <div>Pickers loaded: {pickers.length}</div>
                                        <div className="mt-2 text-amber-700">Check browser console for detailed API logs starting with [Axios], [Dashboard]</div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="card p-6 border border-emerald-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-600" /> Completion Snapshot
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Completed Pickups</span>
                                <span className="font-semibold text-slate-900">{stats.completedPickups}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Completed Dump Reports</span>
                                <span className="font-semibold text-slate-900">{stats.completedReports}</span>
                            </div>
                            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                                <span className="text-sm text-slate-600 inline-flex items-center gap-2">
                                    <Gauge className="h-4 w-4 text-emerald-600" /> Resolution rate
                                </span>
                                <span className="font-bold text-emerald-700">{completionRate}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 border border-blue-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-secondary-700" /> Pickup Category Distribution
                        </h3>
                        {topCategories.length === 0 ? (
                            <p className="text-slate-500">No pickup data available.</p>
                        ) : (
                            <div className="space-y-3">
                                {topCategories.map(([category, count]) => (
                                    <div key={category}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-slate-700 text-sm">{category}</span>
                                            <span className="font-semibold text-slate-900 text-sm">{count}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-secondary-500"
                                                style={{ width: `${ratio(count, stats.totalPickups)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card p-6 border border-rose-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Flame className="h-5 w-5 text-rose-600" /> Active Hotspots
                        </h3>
                        {zoneBreakdown.length === 0 ? (
                            <p className="text-slate-500">No zone information available.</p>
                        ) : (
                            <ul className="space-y-3">
                                {zoneBreakdown.map((zone) => (
                                    <li key={zone.pinCode} className="flex items-center justify-between">
                                        <span className="text-sm text-slate-700">Pin {zone.pinCode}</span>
                                        <span className="admin-chip inline-flex items-center gap-1">
                                            <Activity className="h-3.5 w-3.5 text-rose-600" />
                                            {zone.total} issues
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid lg:grid-cols-3 gap-6">
                    <AdminDonutChart
                        title="Request Type Split"
                        subtitle="Pickups vs dumps in selected range"
                        totalLabel="Requests"
                        data={requestTypeChartData}
                    />
                    <AdminBarListChart
                        title="Top Pickup Categories"
                        subtitle="Most common categories in selected range"
                        rows={categoryChartRows}
                        maxRows={5}
                    />
                    <AdminBarListChart
                        title="Hotspot Load by Pin"
                        subtitle="Highest issue density zones"
                        rows={hotspotRows}
                        maxRows={5}
                    />
                </div>

                <div className="mt-6 grid xl:grid-cols-5 gap-6 items-stretch">
                    <div className="xl:col-span-3 h-full">
                        <AdminTrendChart
                            title={`${trendMode === 'WEEKLY' ? 'Weekly' : 'Monthly'} Trends`}
                            subtitle="Pickups vs dumps over time"
                            data={trendData}
                            firstKey="pickups"
                            secondKey="reports"
                            firstLabel="Pickups"
                            secondLabel="Dumps"
                            className="h-full"
                        />
                    </div>
                    <div className="xl:col-span-2 h-full">
                        <AdminQuickActions
                            pickups={pickups}
                            reports={reports}
                            pickers={pickerOptions}
                            onAssign={handleAssignmentAction}
                            onNote={handleCentreNoteAction}
                            onEscalation={handleEscalationAction}
                            className="h-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
