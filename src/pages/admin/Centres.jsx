import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { MapPin, BarChart3, Search, SlidersHorizontal, Sparkles, ArrowUpDown, CalendarRange } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';
import ListboxSelect from '../../components/ListboxSelect';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminTrendChart from '../../components/admin/AdminTrendChart';
import AdminDonutChart from '../../components/admin/AdminDonutChart';
import AdminBarListChart from '../../components/admin/AdminBarListChart';
import { format, parseISO, startOfMonth, startOfWeek, subDays } from 'date-fns';

const OPEN_STATUSES = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'];

const getSeverity = (load) => {
    if (load >= 80) {
        return 'Critical';
    }

    if (load >= 55) {
        return 'High';
    }

    if (load >= 30) {
        return 'Moderate';
    }

    return 'Low';
};

export default function AdminCentres() {
    const { addToast } = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [minTotal, setMinTotal] = useState('0');
    const [sortBy, setSortBy] = useState('LOAD_DESC');
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [trendMode, setTrendMode] = useState('WEEKLY');
    const [sortConfig, setSortConfig] = useState({ key: 'load', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const fetchZoneStats = async () => {
            try {
                const [{ data: pickupsData }, { data: dumpsData }] = await Promise.all([
                    api.get('/pickups/'),
                    api.get('/illegals/'),
                ]);

                const allItems = [
                    ...(Array.isArray(pickupsData) ? pickupsData : []).map((item) => ({
                        ...item,
                        sourceType: 'PICKUP',
                    })),
                    ...(Array.isArray(dumpsData) ? dumpsData : []).map((item) => ({
                        ...item,
                        sourceType: 'REPORT',
                    })),
                ];

                setItems(allItems);
            } catch (error) {
                addToast(getApiErrorMessage(error, 'Failed to load zone analytics'), 'error');
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchZoneStats();
    }, [addToast]);

    const inDateRange = useMemo(() => {
        return (value) => {
            if (!value) {
                return false;
            }

            const parsed = typeof value === 'string' ? new Date(value) : value;
            if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
                return false;
            }

            const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
            const to = endDate ? new Date(`${endDate}T23:59:59`) : null;

            if (from && parsed < from) {
                return false;
            }

            if (to && parsed > to) {
                return false;
            }

            return true;
        };
    }, [startDate, endDate]);

    const rangeItems = useMemo(() => {
        return items.filter((item) => {
            const itemDate = item.requestedAt || item.reportedAt || item.createdAt || item.updatedAt;
            return inDateRange(itemDate);
        });
    }, [inDateRange, items]);

    const zones = useMemo(() => {
        const byPin = rangeItems.reduce((acc, item) => {
                    const pin = item.pinCode || 'UNKNOWN';
                    if (!acc[pin]) {
                        acc[pin] = {
                            total: 0,
                            open: 0,
                            completed: 0,
                        };
                    }

                    acc[pin].total += 1;

                    if (OPEN_STATUSES.includes(item.status)) {
                        acc[pin].open += 1;
                    }

                    if (item.status === 'COMPLETED') {
                        acc[pin].completed += 1;
                    }

                    return acc;
                }, {});

        const maxTotal = Math.max(...Object.values(byPin).map((item) => item.total), 1);
        return Object.entries(byPin)
            .map(([pinCode, metrics]) => {
                const load = Math.round((metrics.total / maxTotal) * 100);

                return {
                    pinCode,
                    total: metrics.total,
                    open: metrics.open,
                    completed: metrics.completed,
                    load,
                    severity: getSeverity(load),
                };
            })
            .sort((a, b) => b.load - a.load);
    }, [rangeItems]);

    const filteredZones = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const minimum = Number(minTotal || 0);

        const result = zones.filter((zone) => {
            if (zone.total < minimum) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            return String(zone.pinCode).toLowerCase().includes(normalizedSearch);
        });

        return [...result].sort((left, right) => {
            if (sortBy === 'LOAD_ASC') {
                return left.load - right.load;
            }

            if (sortBy === 'PIN_ASC') {
                return String(left.pinCode).localeCompare(String(right.pinCode));
            }

            if (sortBy === 'PIN_DESC') {
                return String(right.pinCode).localeCompare(String(left.pinCode));
            }

            return right.load - left.load;
        });
    }, [zones, searchTerm, minTotal, sortBy]);

    const sortedZones = useMemo(() => {
        const { key, direction } = sortConfig;
        const sorted = [...filteredZones].sort((left, right) => {
            const leftValue = left[key];
            const rightValue = right[key];

            if (typeof leftValue === 'number' && typeof rightValue === 'number') {
                return leftValue - rightValue;
            }

            return String(leftValue || '').localeCompare(String(rightValue || ''));
        });

        return direction === 'asc' ? sorted : sorted.reverse();
    }, [filteredZones, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(sortedZones.length / pageSize));
    const currentPage = Math.min(page, totalPages);

    const paginatedZones = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedZones.slice(startIndex, startIndex + pageSize);
    }, [currentPage, pageSize, sortedZones]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, minTotal, sortBy, startDate, endDate, sortConfig, pageSize]);

    const handleColumnSort = (key) => {
        setSortConfig((previous) => ({
            key,
            direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const renderColumnHeader = (label, key) => {
        const active = sortConfig.key === key;
        return (
            <button
                type="button"
                className={`inline-flex items-center gap-1 ${active ? 'text-primary-700' : ''}`}
                onClick={() => handleColumnSort(key)}
            >
                {label}
                <ArrowUpDown className={`h-3.5 w-3.5 ${active ? 'text-primary-600' : 'text-slate-400'}`} />
            </button>
        );
    };

    const trendData = useMemo(() => {
        const buckets = new Map();

        const getBucket = (value) => {
            const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
            if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
                return null;
            }

            if (trendMode === 'MONTHLY') {
                const start = startOfMonth(parsed);
                return { key: format(start, 'yyyy-MM'), label: format(start, 'MMM yy') };
            }

            const start = startOfWeek(parsed, { weekStartsOn: 1 });
            return { key: format(start, 'yyyy-MM-dd'), label: format(start, 'dd MMM') };
        };

        rangeItems.forEach((item) => {
            const bucket = getBucket(item.requestedAt || item.reportedAt || item.createdAt || item.updatedAt);
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

            if (item.sourceType === 'PICKUP') {
                buckets.get(bucket.key).pickups += 1;
            } else {
                buckets.get(bucket.key).reports += 1;
            }
        });

        return Array.from(buckets.values())
            .sort((left, right) => left.bucket.localeCompare(right.bucket))
            .slice(-10);
    }, [rangeItems, trendMode]);

    const criticalZones = filteredZones.filter((zone) => zone.severity === 'Critical').length;

    const sourceTypeChartData = useMemo(() => {
        const pickups = rangeItems.filter((item) => item.sourceType === 'PICKUP').length;
        const dumps = rangeItems.filter((item) => item.sourceType === 'REPORT').length;

        return [
            { label: 'Pickups', value: pickups, color: '#0ea5e9' },
            { label: 'Dumps', value: dumps, color: '#f59e0b' },
        ];
    }, [rangeItems]);

    const severityChartData = useMemo(() => {
        const counts = filteredZones.reduce((acc, zone) => {
            const key = zone.severity || 'Low';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return [
            { label: 'Critical', value: counts.Critical || 0, color: '#ef4444' },
            { label: 'High', value: counts.High || 0, color: '#f59e0b' },
            { label: 'Moderate', value: counts.Moderate || 0, color: '#0ea5e9' },
            { label: 'Low', value: counts.Low || 0, color: '#22c55e' },
        ];
    }, [filteredZones]);

    const zoneLoadRows = useMemo(() => {
        return filteredZones.slice(0, 6).map((zone, index) => ({
            label: `Pin ${zone.pinCode}`,
            value: zone.total,
            color: ['#ef4444', '#f97316', '#f59e0b', '#0ea5e9', '#14b8a6', '#6366f1'][index % 6],
        }));
    }, [filteredZones]);

    if (loading) {
        return <div className="text-center py-12 text-slate-600">Loading zone analytics...</div>;
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="admin-shell p-6 sm:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Zone Load Analytics</h1>
                    <p className="text-slate-600">Operational view built from pickup and illegal dump activity by pin code.</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="admin-chip">Zones tracked: {zones.length}</span>
                        <span className="admin-chip">Critical zones: {criticalZones}</span>
                    </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-5 mb-6">
                    <div className="lg:col-span-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <CalendarRange className="h-4 w-4 text-slate-500" />
                        <input
                            type="date"
                            className="w-full text-sm text-slate-700 outline-none"
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                        />
                        <span className="text-slate-400 text-xs">to</span>
                        <input
                            type="date"
                            className="w-full text-sm text-slate-700 outline-none"
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <ListboxSelect
                            value={trendMode}
                            onChange={setTrendMode}
                            options={[
                                { value: 'WEEKLY', label: 'Trend Mode: Weekly' },
                                { value: 'MONTHLY', label: 'Trend Mode: Monthly' },
                            ]}
                        />
                    </div>
                    <div className="text-xs text-slate-500 flex items-center justify-start lg:justify-end">
                        Date range applies to zone metrics and trend chart.
                    </div>
                </div>

                <div className="mb-6">
                    <AdminTrendChart
                        title={`${trendMode === 'WEEKLY' ? 'Weekly' : 'Monthly'} Zone Activity`}
                        subtitle="Filtered pickups and dumps volume trend"
                        data={trendData}
                        firstKey="pickups"
                        secondKey="reports"
                        firstLabel="Pickups"
                        secondLabel="Dumps"
                    />
                </div>

                <div className="grid xl:grid-cols-3 gap-5 mb-6">
                    <AdminDonutChart
                        title="Source Activity Mix"
                        subtitle="Filtered pickups vs dumps affecting zones"
                        totalLabel="Events"
                        data={sourceTypeChartData}
                    />
                    <AdminDonutChart
                        title="Zone Severity Breakdown"
                        subtitle="How many zones in each severity band"
                        totalLabel="Zones"
                        data={severityChartData}
                    />
                    <AdminBarListChart
                        title="Top Loaded Zones"
                        subtitle="Highest total volume by pin"
                        rows={zoneLoadRows}
                        maxRows={6}
                    />
                </div>

                <div className="grid gap-3 lg:grid-cols-4 mb-6">
                    <div className="lg:col-span-2 relative">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            className="input-field pl-10"
                            placeholder="Filter by pin code"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <ListboxSelect
                        value={minTotal}
                        onChange={setMinTotal}
                        options={[
                            { value: '0', label: 'Min total: 0' },
                            { value: '3', label: 'Min total: 3' },
                            { value: '5', label: 'Min total: 5' },
                            { value: '10', label: 'Min total: 10' },
                        ]}
                        leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                    />
                    <ListboxSelect
                        value={sortBy}
                        onChange={setSortBy}
                        options={[
                            { value: 'LOAD_DESC', label: 'Sort: Highest load' },
                            { value: 'LOAD_ASC', label: 'Sort: Lowest load' },
                            { value: 'PIN_ASC', label: 'Sort: Pin asc' },
                            { value: 'PIN_DESC', label: 'Sort: Pin desc' },
                        ]}
                    />
                </div>

                <div className="card overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-900 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">{renderColumnHeader('Zone (Pin Code)', 'pinCode')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Total', 'total')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Open', 'open')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Completed', 'completed')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Load', 'load')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Severity', 'severity')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedZones.map((zone) => (
                                    <tr key={zone.pinCode} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            {zone.pinCode}
                                        </td>
                                        <td className="px-6 py-4">{zone.total}</td>
                                        <td className="px-6 py-4">{zone.open}</td>
                                        <td className="px-6 py-4">{zone.completed}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-full max-w-[180px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${zone.load > 80 ? 'bg-rose-500' : zone.load > 55 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${zone.load}%` }}
                                                    ></div>
                                                </div>
                                                <span className="font-medium">{zone.load}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${zone.severity === 'Critical'
                                                ? 'bg-rose-100 text-rose-700 border-rose-200'
                                                : zone.severity === 'High'
                                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                    : zone.severity === 'Moderate'
                                                        ? 'bg-sky-100 text-sky-700 border-sky-200'
                                                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                }`}
                                            >
                                                {zone.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {paginatedZones.length === 0 && (
                                    <tr>
                                        <td className="px-6 py-8 text-center text-slate-500" colSpan={6}>
                                            No zones match the current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <AdminPagination
                    totalItems={sortedZones.length}
                    page={currentPage}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                />

                <div className="card p-4 mt-6 text-sm text-slate-600 flex items-center gap-2 border border-slate-200">
                    <Sparkles className="h-4 w-4 text-secondary-600" />
                    Recommendation: prioritize critical zones for assignment and hold daily follow-up reviews for high-load zones.
                </div>

                <div className="card p-4 mt-4 text-sm text-slate-500 flex items-center gap-2 border border-slate-200">
                    <BarChart3 className="h-4 w-4" /> No dedicated centre management API exists in backend; this page uses reliable pickup/report telemetry instead.
                </div>
            </div>
        </div>
    );
}
