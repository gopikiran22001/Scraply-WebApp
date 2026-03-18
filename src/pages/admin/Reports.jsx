import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { Download, FileText, Search, RefreshCw, Filter, ArrowUpDown, CalendarRange } from 'lucide-react';
import ListboxSelect from '../../components/ListboxSelect';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminTrendChart from '../../components/admin/AdminTrendChart';
import AdminDonutChart from '../../components/admin/AdminDonutChart';
import AdminBarListChart from '../../components/admin/AdminBarListChart';
import { format, parseISO, startOfMonth, startOfWeek, subDays } from 'date-fns';

const STATUS_OPTIONS = [
    { value: 'REQUESTED', label: 'REQUESTED' },
    { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
    { value: 'ASSIGNED', label: 'ASSIGNED' },
    { value: 'COMPLETED', label: 'COMPLETED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
];

export default function AdminReports() {
    const { addToast } = useToast();
    const [pickups, setPickups] = useState([]);
    const [reports, setReports] = useState([]);
    const [pickers, setPickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('LATEST');
    const [trendMode, setTrendMode] = useState('WEEKLY');
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [sortConfig, setSortConfig] = useState({ key: 'reportedAt', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [assignPickerIdMap, setAssignPickerIdMap] = useState({});

    const fetchData = useCallback(async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [{ data: pickupsData }, { data: reportsData }, { data: pickersData }] = await Promise.all([
                api.get('/pickups/'),
                api.get('/illegals/'),
                api.get('/auth/pickers'),
            ]);

            const pickups = Array.isArray(pickupsData) ? pickupsData : [];
            const illegalReports = Array.isArray(reportsData) ? reportsData : [];
            const pickersList = Array.isArray(pickersData) ? pickersData : [];

            setPickups(pickups);
            setReports(illegalReports);
            setPickers(pickersList);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Error fetching report data'), 'error');
            setPickups([]);
            setReports([]);
            setPickers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateReportStatus = async (reportId, nextStatus) => {
        // Check if status is ASSIGNED and require picker selection
        if (nextStatus === 'ASSIGNED') {
            const pickerIdForReport = assignPickerIdMap[reportId];
            if (!pickerIdForReport) {
                addToast('Select a picker before assigning report', 'error');
                return;
            }
        }

        try {
            const payload = {
                id: reportId,
                status: nextStatus,
            };

            // Include assignedTo if status is ASSIGNED
            if (nextStatus === 'ASSIGNED') {
                payload.assignedTo = assignPickerIdMap[reportId];
            }

            await api.put('/illegals/', payload);

            setReports((prev) => prev.map((report) => (
                report.id === reportId ? { ...report, status: nextStatus } : report
            )));
            
            // Clear the picker for this report after successful assignment
            setAssignPickerIdMap((prev) => {
                const updated = { ...prev };
                delete updated[reportId];
                return updated;
            });

            addToast('Report status updated', 'success');
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update report status'), 'error');
        }
    };

    const pickerOptions = useMemo(() => {
        return pickers.map((picker) => ({
            value: picker.id,
            label: picker.phone
                ? `${picker.name} (${picker.phone})`
                : picker.name,
        })).sort((left, right) => left.label.localeCompare(right.label));
    }, [pickers]);

    const inDateRange = useCallback((value) => {
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
    }, [startDate, endDate]);

    const filteredPickupsForStats = useMemo(() => {
        return pickups.filter((item) => inDateRange(item.requestedAt || item.createdAt || item.updatedAt));
    }, [inDateRange, pickups]);

    const filteredDumpsForStats = useMemo(() => {
        return reports.filter((item) => inDateRange(item.reportedAt || item.createdAt || item.updatedAt));
    }, [inDateRange, reports]);

    const stats = useMemo(() => {
        const wasteByType = filteredPickupsForStats.reduce((acc, item) => {
            const key = item.category || 'UNKNOWN';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const pickupsByStatus = filteredPickupsForStats.reduce((acc, item) => {
            const key = item.status || 'UNKNOWN';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const dumpsByStatus = filteredDumpsForStats.reduce((acc, item) => {
            const key = item.status || 'UNKNOWN';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const requestStatusOverview = Object.entries({ ...pickupsByStatus, ...dumpsByStatus }).reduce((acc, [status]) => {
            acc[status] = (pickupsByStatus[status] || 0) + (dumpsByStatus[status] || 0);
            return acc;
        }, {});

        return {
            wasteByType,
            requestStatusOverview,
        };
    }, [filteredDumpsForStats, filteredPickupsForStats]);

    const filteredReports = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const to = endDate ? new Date(`${endDate}T23:59:59`) : null;

        const matches = reports.filter((report) => {
            if (statusFilter !== 'ALL' && report.status !== statusFilter) {
                return false;
            }

            const reportDate = report.reportedAt || report.createdAt || report.updatedAt;
            if (reportDate) {
                const parsedDate = new Date(reportDate);
                if (!Number.isNaN(parsedDate.getTime())) {
                    if (from && parsedDate < from) {
                        return false;
                    }

                    if (to && parsedDate > to) {
                        return false;
                    }
                }
            }

            if (!normalizedSearch) {
                return true;
            }

            const address = String(report.address || '').toLowerCase();
            const description = String(report.description || '').toLowerCase();
            const id = String(report.id || '').toLowerCase();

            return id.includes(normalizedSearch)
                || address.includes(normalizedSearch)
                || description.includes(normalizedSearch);
        });

        return [...matches].sort((left, right) => {
            const leftTime = left.reportedAt ? new Date(left.reportedAt).getTime() : 0;
            const rightTime = right.reportedAt ? new Date(right.reportedAt).getTime() : 0;

            if (sortBy === 'OLDEST') {
                return leftTime - rightTime;
            }

            if (sortBy === 'STATUS') {
                return String(left.status || '').localeCompare(String(right.status || ''));
            }

            return rightTime - leftTime;
        });
    }, [reports, searchTerm, statusFilter, sortBy, startDate, endDate]);

    const sortedReports = useMemo(() => {
        const { key, direction } = sortConfig;
        const sorted = [...filteredReports].sort((left, right) => {
            let leftValue;
            let rightValue;

            if (key === 'reportedAt') {
                leftValue = new Date(left.reportedAt || left.createdAt || left.updatedAt || 0).getTime();
                rightValue = new Date(right.reportedAt || right.createdAt || right.updatedAt || 0).getTime();
            } else {
                leftValue = String(left[key] || '');
                rightValue = String(right[key] || '');
            }

            if (typeof leftValue === 'number' && typeof rightValue === 'number') {
                return leftValue - rightValue;
            }

            return String(leftValue).localeCompare(String(rightValue));
        });

        return direction === 'asc' ? sorted : sorted.reverse();
    }, [filteredReports, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(sortedReports.length / pageSize));
    const currentPage = Math.min(page, totalPages);

    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedReports.slice(startIndex, startIndex + pageSize);
    }, [currentPage, pageSize, sortedReports]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter, sortBy, startDate, endDate, sortConfig, pageSize]);

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

        filteredPickupsForStats.forEach((item) => {
            const bucket = getBucket(item.requestedAt || item.createdAt || item.updatedAt);
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
            const bucket = getBucket(item.reportedAt || item.createdAt || item.updatedAt);
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
    }, [filteredPickupsForStats, filteredReports, trendMode]);

    const pickupCategoryRows = useMemo(() => {
        return Object.entries(stats.wasteByType).map(([label, value], index) => ({
            label,
            value,
            color: ['#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][index % 6],
        }));
    }, [stats.wasteByType]);

    const requestStatusChartData = useMemo(() => {
        return Object.entries(stats.requestStatusOverview).map(([label, value], index) => ({
            label,
            value,
            color: ['#f59e0b', '#6366f1', '#0ea5e9', '#22c55e', '#ef4444', '#94a3b8'][index % 6],
        }));
    }, [stats.requestStatusOverview]);

    const dumpsStatusRows = useMemo(() => {
        const counts = filteredReports.reduce((acc, report) => {
            const key = report.status || 'UNKNOWN';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts).map(([label, value], index) => ({
            label,
            value,
            color: ['#f97316', '#f59e0b', '#0ea5e9', '#22c55e', '#ef4444', '#6366f1'][index % 6],
        }));
    }, [filteredReports]);

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

    const downloadCsv = () => {
        if (filteredReports.length === 0) {
            addToast('No report data available for export', 'error');
            return;
        }

        const headers = ['id', 'address', 'description', 'status', 'reportedAt'];
        const rows = filteredReports.map((report) => [
            report.id,
            report.address,
            report.description,
            report.status,
            report.reportedAt,
        ]);

        const escapeValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const csv = [
            headers.join(','),
            ...rows.map((row) => row.map(escapeValue).join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `illegal-reports-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast('Report exported as CSV', 'success');
    };

    const statusBadgeClass = (status) => {
        if (status === 'COMPLETED') {
            return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        }

        if (status === 'CANCELLED') {
            return 'bg-rose-100 text-rose-700 border border-rose-200';
        }

        if (status === 'IN_PROGRESS') {
            return 'bg-sky-100 text-sky-700 border border-sky-200';
        }

        if (status === 'ASSIGNED') {
            return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
        }

        return 'bg-amber-100 text-amber-700 border border-amber-200';
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-600">Loading report center...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="admin-shell p-6 sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">System Reports</h1>
                        <p className="text-slate-600 mt-1">Deep view of pickup and dump trends plus illegal dump lifecycle.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-secondary inline-flex items-center gap-2"
                            type="button"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button className="btn btn-primary inline-flex items-center gap-2" type="button" onClick={downloadCsv}>
                            <Download className="h-4 w-4" /> Export CSV
                        </button>
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
                        Filters apply to analytics and tables.
                    </div>
                </div>

                <div className="mb-6">
                    <AdminTrendChart
                        title={`${trendMode === 'WEEKLY' ? 'Weekly' : 'Monthly'} Activity Trend`}
                        subtitle="Pickups vs dumps volume in selected range"
                        data={trendData}
                        firstKey="pickups"
                        secondKey="reports"
                        firstLabel="Pickups"
                        secondLabel="Dumps"
                    />
                </div>

                <div className="grid xl:grid-cols-3 gap-5 mb-6">
                    <AdminBarListChart
                        title="Pickup Category Distribution"
                        subtitle="Most frequent pickup categories"
                        rows={pickupCategoryRows}
                        maxRows={6}
                    />
                    <AdminDonutChart
                        title="All Request Status Mix"
                        subtitle="Combined pickups and dumps statuses"
                        totalLabel="Requests"
                        data={requestStatusChartData}
                    />
                    <AdminBarListChart
                        title="Dump Status Distribution"
                        subtitle="Status split for filtered dumps"
                        rows={dumpsStatusRows}
                        maxRows={6}
                    />
                </div>

                <div className="grid gap-3 lg:grid-cols-4 mb-4">
                    <div className="lg:col-span-2 relative">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by ID, location, description"
                            className="input-field pl-10"
                        />
                    </div>
                    <ListboxSelect
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[{ value: 'ALL', label: 'All statuses' }, ...STATUS_OPTIONS]}
                        leftIcon={<Filter className="h-4 w-4" />}
                    />
                    <ListboxSelect
                        value={sortBy}
                        onChange={setSortBy}
                        options={[
                            { value: 'LATEST', label: 'Sort: Latest first' },
                            { value: 'OLDEST', label: 'Sort: Oldest first' },
                            { value: 'STATUS', label: 'Sort: Status' },
                        ]}
                    />
                </div>

                <h2 className="text-lg font-bold text-slate-900 mt-6 mb-4">Illegal Dump Reports ({sortedReports.length})</h2>
                <div className="card overflow-hidden mb-8">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-900 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Image</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Location', 'address')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Description', 'description')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Status', 'status')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Date', 'reportedAt')}</th>
                                    <th className="px-6 py-4">Picker</th>
                                    <th className="px-6 py-4">Update</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {report.imageUrl ? (
                                                <img src={report.imageUrl} alt="Report" className="h-10 w-10 object-cover rounded border border-slate-200" />
                                            ) : (
                                                <span className="text-slate-400 text-xs">No image</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={report.address}>{report.address || 'N/A'}</td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={report.description}>{report.description || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(report.status)}`}>
                                                {report.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{report.reportedAt ? new Date(report.reportedAt).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-6 py-4 max-w-xs">
                                            {report.status === 'ASSIGNED' ? (
                                                <span className="text-sm text-slate-600">{report.pickerName || 'N/A'}</span>
                                            ) : (
                                                <ListboxSelect
                                                    value={assignPickerIdMap[report.id] || ''}
                                                    onChange={(pickerId) => setAssignPickerIdMap((prev) => ({ ...prev, [report.id]: pickerId }))}
                                                    options={pickerOptions}
                                                    placeholder="Select picker"
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 w-52">
                                            <ListboxSelect
                                                value={report.status}
                                                onChange={(newStatus) => updateReportStatus(report.id, newStatus)}
                                                options={STATUS_OPTIONS}
                                            />
                                        </td>
                                    </tr>
                                ))}

                                {paginatedReports.length === 0 && (
                                    <tr>
                                        <td className="px-6 py-8 text-center text-slate-500" colSpan={7}>
                                            No dumps match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <AdminPagination
                    totalItems={sortedReports.length}
                    page={currentPage}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                />

                <h2 className="text-lg font-bold text-slate-900 mb-4">Available Exports</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {['Illegal Reports (Filtered CSV)', 'Pickup Status Summary', 'Category Distribution'].map((reportName) => (
                        <button
                            key={reportName}
                            className="card p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group text-left"
                            type="button"
                            onClick={downloadCsv}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                    <FileText className="h-5 w-5 text-slate-500" />
                                </div>
                                <span className="font-medium text-slate-700">{reportName}</span>
                            </div>
                            <Download className="h-4 w-4 text-slate-400 group-hover:text-primary-600" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
