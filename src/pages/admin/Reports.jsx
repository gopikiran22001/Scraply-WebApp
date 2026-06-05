import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { Download, FileText, Search, RefreshCw, Filter, ArrowUpDown, CalendarRange, BarChart3, Activity, Calendar } from 'lucide-react';
import ListboxSelect from '../../components/ListboxSelect';
import ComboboxSelect from '../../components/ComboboxSelect';
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

const REQUEST_TYPE_OPTIONS = [
    { value: 'ALL', label: 'All Requests' },
    { value: 'PICKUP', label: 'Pickups' },
    { value: 'DUMP', label: 'Illegal Dumps' },
];

const EXPORT_SCOPE_OPTIONS = [
    { value: 'ALL', label: 'Export: All' },
    { value: 'PICKUP', label: 'Export: Pickups' },
    { value: 'DUMP', label: 'Export: Illegal Dumps' },
];


export default function AdminReports() {
    const getDateTimeLocalValue = (date) => {
        const offsetMs = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
    };

    const { addToast } = useToast();
    const [pickups, setPickups] = useState([]);
    const [reports, setReports] = useState([]);
    const [pickers, setPickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [requestTypeFilter, setRequestTypeFilter] = useState('ALL');
    const [exportScope, setExportScope] = useState('ALL');
    const [sortBy, setSortBy] = useState('LATEST');
    const [trendMode, setTrendMode] = useState('WEEKLY');
    // Set date range to current month (1st of month to today)
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [sortConfig, setSortConfig] = useState({ key: 'reportedAt', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [assignPickerIdMap, setAssignPickerIdMap] = useState({});
    const [agentLogReport, setAgentLogReport] = useState(null);
    const [agentLogs, setAgentLogs] = useState([]);
    const [agentLogLoading, setAgentLogLoading] = useState(false);
    const [agentLogLevelFilter, setAgentLogLevelFilter] = useState('ALL');
    const [agentLogAgentFilter, setAgentLogAgentFilter] = useState('ALL');
    const [agentLogEventFilter, setAgentLogEventFilter] = useState('ALL');
    const [agentLogRequestTypeFilter, setAgentLogRequestTypeFilter] = useState('ALL');
    const [agentLogRangePreset, setAgentLogRangePreset] = useState('24H');
    const [agentLogStartAt, setAgentLogStartAt] = useState(getDateTimeLocalValue(new Date(Date.now() - (24 * 60 * 60 * 1000))));
    const [agentLogEndAt, setAgentLogEndAt] = useState(getDateTimeLocalValue(new Date()));
    const [agentLogPage, setAgentLogPage] = useState(1);
    const [agentLogPageSize, setAgentLogPageSize] = useState(10);

    const fetchAgentLogs = useCallback(async (showLoading = false) => {
        const presetHours = {
            '24H': 24,
            '7D': 24 * 7,
            '30D': 24 * 30,
            'ALL': 24 * 30,
        };

        const hours = presetHours[agentLogRangePreset] || 24;
        const limit = agentLogRangePreset === 'ALL' ? 200 : 200;

        if (showLoading) {
            setAgentLogLoading(true);
        }

        try {
            const { data: logReportData } = await api.get('/auth/agent-logs/report', {
                params: {
                    hours,
                    limit,
                },
            });
            setAgentLogReport(logReportData || null);
            setAgentLogs(Array.isArray(logReportData?.recentLogs) ? logReportData.recentLogs : []);
        } catch {
            setAgentLogReport(null);
            setAgentLogs([]);
        } finally {
            if (showLoading) {
                setAgentLogLoading(false);
            }
        }
    }, [agentLogRangePreset]);

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

            const pickups = (Array.isArray(pickupsData) ? pickupsData : []).map((item) => ({
                ...item,
                displayId: String(item.id || 'NODATA').slice(-6),
            }));
            
            const illegalReports = (Array.isArray(reportsData) ? reportsData : []).map((item) => ({
                ...item,
                displayId: String(item.id || 'NODATA').slice(-6),
            }));
            
            const pickersList = Array.isArray(pickersData) ? pickersData : [];

            setPickups(pickups);
            setReports(illegalReports);
            setPickers(pickersList);
            
            // Debug logging
            console.log('[Reports] API Response Summary:');
            console.log(`  Pickups: ${pickups.length} items`);
            console.log(`  Reports: ${illegalReports.length} items`);
            const invalidReports = illegalReports.filter(r => !r.id);
            if (invalidReports.length > 0) {
                console.warn(`  WARNING: ${invalidReports.length} reports have missing IDs`);
            }

            await fetchAgentLogs(true);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Error fetching report data'), 'error');
            setPickups([]);
            setReports([]);
            setPickers([]);
            setAgentLogReport(null);
            setAgentLogs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [addToast, fetchAgentLogs]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!loading) {
            fetchAgentLogs(false); // Don't show loading when range preset changes
        }
    }, [agentLogRangePreset, fetchAgentLogs, loading]);

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

        // Combine pickups and dumps with type field
        const combined = [
            ...pickups.map(item => ({ ...item, requestType: 'PICKUP', dateField: item.requestedAt || item.createdAt || item.updatedAt })),
            ...reports.map(item => ({ ...item, requestType: 'DUMP', dateField: item.reportedAt || item.createdAt || item.updatedAt }))
        ];

        const matches = combined.filter((item) => {
            // Filter by request type
            if (requestTypeFilter !== 'ALL' && item.requestType !== requestTypeFilter) {
                return false;
            }

            // Filter by status
            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }

            // Filter by date range
            if (item.dateField) {
                const parsedDate = new Date(item.dateField);
                if (!Number.isNaN(parsedDate.getTime())) {
                    if (from && parsedDate < from) {
                        return false;
                    }

                    if (to && parsedDate > to) {
                        return false;
                    }
                }
            }

            // Search filter
            if (!normalizedSearch) {
                return true;
            }

            const address = String(item.address || '').toLowerCase();
            const description = String(item.description || '').toLowerCase();
            const category = String(item.category || '').toLowerCase();
            const id = String(item.id || '').toLowerCase();

            return id.includes(normalizedSearch)
                || address.includes(normalizedSearch)
                || description.includes(normalizedSearch)
                || category.includes(normalizedSearch);
        });

        return [...matches].sort((left, right) => {
            const leftTime = left.dateField ? new Date(left.dateField).getTime() : 0;
            const rightTime = right.dateField ? new Date(right.dateField).getTime() : 0;

            if (sortBy === 'OLDEST') {
                return leftTime - rightTime;
            }

            if (sortBy === 'STATUS') {
                return String(left.status || '').localeCompare(String(right.status || ''));
            }

            return rightTime - leftTime;
        });
    }, [pickups, reports, searchTerm, statusFilter, requestTypeFilter, sortBy, startDate, endDate]);

    const sortedReports = useMemo(() => {
        const { key, direction } = sortConfig;
        const sorted = [...filteredReports].sort((left, right) => {
            let leftValue;
            let rightValue;

            if (key === 'reportedAt' || key === 'requestedAt') {
                leftValue = new Date(left.dateField || 0).getTime();
                rightValue = new Date(right.dateField || 0).getTime();
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
    }, [searchTerm, statusFilter, requestTypeFilter, sortBy, startDate, endDate, sortConfig, pageSize]);

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
        const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const to = endDate ? new Date(`${endDate}T23:59:59`) : null;
        const normalizedSearch = searchTerm.trim().toLowerCase();

        const allRequests = [
            ...pickups.map((item) => ({
                ...item,
                requestType: 'PICKUP',
                dateField: item.requestedAt || item.createdAt || item.updatedAt,
            })),
            ...reports.map((item) => ({
                ...item,
                requestType: 'DUMP',
                dateField: item.reportedAt || item.createdAt || item.updatedAt,
            })),
        ];

        const exportRows = allRequests.filter((item) => {
            if (exportScope !== 'ALL' && item.requestType !== exportScope) {
                return false;
            }

            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }

            if (item.dateField) {
                const parsedDate = new Date(item.dateField);
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

            const address = String(item.address || '').toLowerCase();
            const description = String(item.description || '').toLowerCase();
            const category = String(item.category || '').toLowerCase();
            const id = String(item.id || '').toLowerCase();

            return id.includes(normalizedSearch)
                || address.includes(normalizedSearch)
                || description.includes(normalizedSearch)
                || category.includes(normalizedSearch);
        });

        if (exportRows.length === 0) {
            addToast('No report data available for export', 'error');
            return;
        }

        const headers = ['type', 'id', 'address', 'description', 'status', 'date'];
        const rows = exportRows.map((item) => [
            item.requestType,
            item.id,
            item.address || '',
            item.description || item.category || '',
            item.status,
            item.dateField,
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
        const exportScopeLabel = exportScope === 'ALL' ? 'all' : exportScope.toLowerCase();
        link.setAttribute('download', `reports-${exportScopeLabel}-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast('Reports exported as CSV', 'success');
    };

    const downloadAgentLogsCsv = () => {
        if (filteredAgentLogs.length === 0) {
            addToast('No agent log data available for export', 'error');
            return;
        }
        const headers = ['id', 'agentId', 'level', 'message', 'eventType', 'requestType', 'requestId', 'details', 'createdAt'];
        const rows = filteredAgentLogs.map((log) => [
            log.id,
            log.agentId,
            log.level,
            log.message,
            log.eventType,
            log.requestType,
            log.requestId,
            log.details,
            log.createdAt,
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
        link.setAttribute('download', `agent-logs-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast('Agent logs exported as CSV', 'success');
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

    const logLevelBadgeClass = (level) => {
        const normalized = String(level || '').toUpperCase();
        if (normalized === 'ERROR') {
            return 'bg-rose-100 text-rose-700 border border-rose-200';
        }
        if (normalized === 'WARNING' || normalized === 'WARN') {
            return 'bg-amber-100 text-amber-700 border border-amber-200';
        }
        if (normalized === 'DEBUG') {
            return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
        return 'bg-sky-100 text-sky-700 border border-sky-200';
    };

    const filteredAgentLogs = useMemo(() => {
        if (!Array.isArray(agentLogs)) return [];

        return agentLogs.filter((log) => {
            const levelMatch = agentLogLevelFilter === 'ALL' || String(log.level).toUpperCase() === agentLogLevelFilter;
            const agentMatch = agentLogAgentFilter === 'ALL' || String(log.agentId) === agentLogAgentFilter;
            const eventMatch = agentLogEventFilter === 'ALL' || String(log.eventType) === agentLogEventFilter;
            const requestTypeMatch = agentLogRequestTypeFilter === 'ALL' || String(log.requestType || '').trim().toUpperCase() === agentLogRequestTypeFilter;

            return levelMatch && agentMatch && eventMatch && requestTypeMatch;
        });
    }, [agentLogs, agentLogLevelFilter, agentLogAgentFilter, agentLogEventFilter, agentLogRequestTypeFilter]);

    const agentLogRequestTypeOptions = useMemo(() => {
        const types = Array.from(new Set((agentLogs || [])
            .map((log) => String(log.requestType || '').trim())
            .filter(Boolean)))
            .sort((left, right) => left.localeCompare(right));

        return [
            { value: 'ALL', label: 'All request types' },
            ...types.map((type) => ({ value: type.toUpperCase(), label: type })),
        ];
    }, [agentLogs]);

    const paginatedAgentLogs = useMemo(() => {
        const startIndex = (agentLogPage - 1) * agentLogPageSize;
        return filteredAgentLogs.slice(startIndex, startIndex + agentLogPageSize);
    }, [agentLogPage, agentLogPageSize, filteredAgentLogs]);

    const agentLogTotalPages = Math.max(1, Math.ceil(filteredAgentLogs.length / agentLogPageSize));

    useEffect(() => {
        // Only reset page if we're beyond the available pages
        if (agentLogPage > agentLogTotalPages && agentLogTotalPages > 0) {
            setAgentLogPage(1);
        }
    }, [agentLogLevelFilter, agentLogAgentFilter, agentLogEventFilter, agentLogRequestTypeFilter, agentLogRangePreset, agentLogPageSize, agentLogPage, agentLogTotalPages]);



    if (loading) {
        return <div className="text-center py-12 text-slate-600">Loading report center...</div>;
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="admin-shell p-6 sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">System Reports</h1>
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
                        <div className="min-w-[180px]">
                            <ListboxSelect
                                value={exportScope}
                                onChange={setExportScope}
                                options={EXPORT_SCOPE_OPTIONS}
                                leftIcon={<FileText className="h-4 w-4" />}
                            />
                        </div>
                        <button className="btn btn-primary inline-flex items-center gap-2" type="button" onClick={downloadCsv}>
                            <Download className="h-4 w-4" /> Export CSV
                        </button>
                    </div>
                </div>

                <div className="mb-6">
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
                        Filters apply to analytics, charts, and report tables
                    </div>

                    <div className="mt-6">
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

                <div className="grid gap-3 lg:grid-cols-5 mb-4">
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
                        value={requestTypeFilter}
                        onChange={setRequestTypeFilter}
                        options={REQUEST_TYPE_OPTIONS}
                        leftIcon={<Filter className="h-4 w-4" />}
                    />
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

                <h2 className="text-lg font-bold text-slate-900 mt-6 mb-4">All Requests ({sortedReports.length})</h2>
                <div className="card overflow-hidden mb-8">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-900 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Image</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Location', 'address')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Description', 'description')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Status', 'status')}</th>
                                    <th className="px-6 py-4">{renderColumnHeader('Date', 'dateField')}</th>
                                    <th className="px-6 py-4">Assigned To</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedReports.map((item) => (
                                    <tr key={`${item.requestType}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.requestType === 'PICKUP' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {item.requestType === 'PICKUP' ? 'Pickup' : 'Dump'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt="Request" className="h-10 w-10 object-cover rounded border border-slate-200" />
                                            ) : (
                                                <span className="text-slate-400 text-xs">No image</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={item.address}>{item.address || 'N/A'}</td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={item.description || item.category}>{item.description || item.category || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(item.status)}`}>
                                                {item.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{item.dateField ? new Date(item.dateField).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <span className="text-sm text-slate-600">
                                                {item.status === 'ASSIGNED' ? (item.pickerName || 'N/A') : 'Not Assigned'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {paginatedReports.length === 0 && (
                                    <tr>
                                        <td className="px-6 py-8 text-center text-slate-500" colSpan={7}>
                                            No requests match your filters.
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

                <h2 className="text-lg font-bold text-slate-900 mt-10 mb-4 flex items-center gap-2">
                    Agent Logs Report
                    {agentLogLoading && (
                        <RefreshCw className="h-4 w-4 animate-spin text-primary-600" />
                    )}
                </h2>
                <div className="grid md:grid-cols-3 gap-4 mb-5">
                    <div className="card p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Total Logs</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{agentLogReport?.totalLogs ?? 0}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Error Logs</p>
                        <p className="text-2xl font-bold text-rose-700 mt-1">{agentLogReport?.errorLogs ?? 0}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Warning Logs</p>
                        <p className="text-2xl font-bold text-amber-700 mt-1">{agentLogReport?.warningLogs ?? 0}</p>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-5 mb-3 items-end">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Range</label>
                        <ListboxSelect
                            value={agentLogRangePreset}
                            onChange={setAgentLogRangePreset}
                            options={[
                                { value: '24H', label: 'Last 24 hours' },
                                { value: '7D', label: 'Last 7 days' },
                                { value: '30D', label: 'Last 30 days' },
                                { value: 'ALL', label: 'All (max available)' },
                            ]}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
                        <input
                            type="datetime-local"
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            value={agentLogStartAt}
                            onChange={(event) => setAgentLogStartAt(event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
                        <input
                            type="datetime-local"
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            value={agentLogEndAt}
                            onChange={(event) => setAgentLogEndAt(event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Request Type</label>
                        <ListboxSelect
                            value={agentLogRequestTypeFilter}
                            onChange={setAgentLogRequestTypeFilter}
                            options={agentLogRequestTypeOptions}
                        />
                    </div>
                    <div>
                        <button
                            className="btn btn-secondary inline-flex items-center gap-2 h-11 w-full justify-center"
                            type="button"
                            onClick={() => {
                                const end = new Date();
                                const start = new Date(end.getTime() - (24 * 60 * 60 * 1000));
                                setAgentLogRangePreset('24H');
                                setAgentLogStartAt(getDateTimeLocalValue(start));
                                setAgentLogEndAt(getDateTimeLocalValue(end));
                            }}
                        >
                            Set 24h
                        </button>
                    </div>
                </div>

                {/* Agent log filters and CSV export in a single horizontal bar */}
                <div className="flex flex-row gap-3 mb-4 items-center">
                    <div className="flex-1 min-w-[160px]">
                        <ListboxSelect
                            value={agentLogLevelFilter}
                            onChange={setAgentLogLevelFilter}
                            options={[{ value: 'ALL', label: 'All levels' },
                                { value: 'ERROR', label: 'Error' },
                                { value: 'WARNING', label: 'Warning' },
                                { value: 'WARN', label: 'Warn' },
                                { value: 'INFO', label: 'Info' },
                                { value: 'DEBUG', label: 'Debug' }]} />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <ListboxSelect
                            value={agentLogAgentFilter}
                            onChange={setAgentLogAgentFilter}
                            options={[{ value: 'ALL', label: 'All agents' },
                                ...Array.from(new Set((agentLogs || []).map(l => l.agentId))).filter(Boolean).map(agentId => ({ value: agentId, label: agentId }))]} />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <ListboxSelect
                            value={agentLogEventFilter}
                            onChange={setAgentLogEventFilter}
                            options={[{ value: 'ALL', label: 'All events' },
                                ...Array.from(new Set((agentLogs || []).map(l => l.eventType))).filter(Boolean).map(eventType => ({ value: eventType, label: eventType }))]} />
                    </div>
                    <button className="btn btn-primary inline-flex items-center gap-2 h-12" type="button" onClick={downloadAgentLogsCsv}>
                        <Download className="h-4 w-4" /> Export Agent Logs CSV
                    </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                    <div className="text-xs text-slate-500">
                        Showing {Math.min(filteredAgentLogs.length, (agentLogPage - 1) * agentLogPageSize + 1)}-{Math.min(filteredAgentLogs.length, agentLogPage * agentLogPageSize)} of {filteredAgentLogs.length} logs
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="min-w-[140px]">
                            <ListboxSelect
                                value={String(agentLogPageSize)}
                                onChange={(value) => setAgentLogPageSize(Number(value))}
                                options={[
                                    { value: '10', label: '10 / page' },
                                    { value: '20', label: '20 / page' },
                                    { value: '50', label: '50 / page' },
                                    { value: '100', label: '100 / page' },
                                ]}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
                                onClick={() => setAgentLogPage((prev) => Math.max(1, prev - 1))}
                                disabled={agentLogPage <= 1}
                            >
                                Prev
                            </button>
                            <span className="text-sm text-slate-600">
                                {agentLogPage} / {agentLogTotalPages}
                            </span>
                            <button
                                type="button"
                                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
                                onClick={() => setAgentLogPage((prev) => Math.min(agentLogTotalPages, prev + 1))}
                                disabled={agentLogPage >= agentLogTotalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`card overflow-hidden mb-8 transition-opacity duration-200 ${agentLogLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-900 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Level</th>
                                    <th className="px-6 py-4">Agent</th>
                                    <th className="px-6 py-4">Request</th>
                                    <th className="px-6 py-4">Event</th>
                                    <th className="px-6 py-4">Message</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedAgentLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${logLevelBadgeClass(log.level)}`}>
                                                {log.level || 'INFO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{log.agentId || 'N/A'}</td>
                                        <td className="px-6 py-4">{log.requestId || 'N/A'}</td>
                                        <td className="px-6 py-4">{log.eventType || 'GENERAL'}</td>
                                        <td className="px-6 py-4 max-w-xl truncate" title={log.message}>{log.message || 'N/A'}</td>
                                    </tr>
                                ))}

                                {filteredAgentLogs.length === 0 && (
                                    <tr>
                                        <td className="px-6 py-8 text-center text-slate-500" colSpan={6}>
                                            No agent logs available yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

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
