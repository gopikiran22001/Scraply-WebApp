import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ListboxSelect from '../../components/ListboxSelect';
import ComboboxSelect from '../../components/ComboboxSelect';
import { getApiErrorMessage } from '../../utils/apiError';
import { Search, RefreshCw, SlidersHorizontal, CheckCheck, ArrowUpDown, CalendarRange } from 'lucide-react';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminDonutChart from '../../components/admin/AdminDonutChart';
import AdminBarListChart from '../../components/admin/AdminBarListChart';
import { format, subDays, startOfMonth } from 'date-fns';

const STATUS_OPTIONS = [
    { value: 'REQUESTED', label: 'REQUESTED' },
    { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
    { value: 'ASSIGNED', label: 'ASSIGNED' },
    { value: 'COMPLETED', label: 'COMPLETED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
];

export default function AdminPickups() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [pickers, setPickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('NEWEST');
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [bulkStatus, setBulkStatus] = useState('ASSIGNED');
    const [assignPickerId, setAssignPickerId] = useState('');
    // Set date range to current month (1st of month to today)
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [sortConfig, setSortConfig] = useState({ key: 'activityDate', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const getRequestKey = (request) => `${request.requestType}:${request.id}`;

    const fetchRequests = useCallback(async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            console.log('[Pickups] Fetching data from APIs...');
            const [pickupsResponse, dumpsResponse, pickersResponse] = await Promise.all([
                api.get('/pickups/'),
                api.get('/illegals/'),
                api.get('/auth/pickers'),
            ]);

            const pickupsData = pickupsResponse?.data;
            const dumpsData = dumpsResponse?.data;
            const pickersData = pickersResponse?.data;

            console.log('[Pickups] API Responses received:');
            console.log('  /pickups/ response type:', typeof pickupsData, 'is array:', Array.isArray(pickupsData), 'length:', Array.isArray(pickupsData) ? pickupsData.length : 'N/A');
            console.log('  /illegals/ response type:', typeof dumpsData, 'is array:', Array.isArray(dumpsData), 'length:', Array.isArray(dumpsData) ? dumpsData.length : 'N/A');
            console.log('  /auth/pickers response type:', typeof pickersData, 'is array:', Array.isArray(pickersData), 'length:', Array.isArray(pickersData) ? pickersData.length : 'N/A');

            if (pickupsData && !Array.isArray(pickupsData)) {
                console.log('  Raw /pickups/ response:', pickupsData);
            }
            if (dumpsData && !Array.isArray(dumpsData)) {
                console.log('  Raw /illegals/ response:', dumpsData);
            }

            const pickupItems = (Array.isArray(pickupsData) ? pickupsData : []).map((item) => ({
                ...item,
                requestType: 'PICKUP',
                activityDate: item.requestedAt || item.createdAt || item.updatedAt || null,
                requestLabel: 'Pickup',
                displayId: String(item.id || 'NODATA').slice(-6),
            }));

            const dumpItems = (Array.isArray(dumpsData) ? dumpsData : []).map((item) => ({
                ...item,
                requestType: 'DUMP',
                activityDate: item.reportedAt || item.createdAt || item.updatedAt || null,
                requestLabel: 'Dump',
                displayId: String(item.id || 'NODATA').slice(-6),
            }));

            const allRequests = [...pickupItems, ...dumpItems];
            setRequests(allRequests);
            setPickers(Array.isArray(pickersData) ? pickersData : []);
            
            console.log('[Pickups] Parsed Data:');
            console.log(`  Pickups: ${pickupItems.length} items`);
            console.log(`  Dumps: ${dumpItems.length} items`);
            console.log(`  Total: ${allRequests.length} items`);
            
            if (allRequests.length > 0) {
                console.log('  First request sample:', {
                    id: allRequests[0].id,
                    type: allRequests[0].requestType,
                    status: allRequests[0].status,
                });
                const invalidIds = allRequests.filter(r => !r.id);
                if (invalidIds.length > 0) {
                    console.warn(`  ⚠️ ${invalidIds.length} requests have missing IDs`);
                }
            } else {
                console.warn('[Pickups] ⚠️ No requests returned - check if database has data');
            }
        } catch (error) {
            console.error('[Pickups] API Error:', error);
            console.error('  Error message:', error.message);
            console.error('  Error response:', error.response?.data);
            console.error('  Error status:', error.response?.status);
            addToast(getApiErrorMessage(error, 'Failed to load pickups and dumps'), 'error');
            setRequests([]);
            setPickers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const filteredRequests = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const to = endDate ? new Date(`${endDate}T23:59:59`) : null;

        const matches = requests.filter((request) => {
            if (statusFilter !== 'ALL' && request.status !== statusFilter) {
                return false;
            }

            if (typeFilter !== 'ALL' && request.requestType !== typeFilter) {
                return false;
            }

            if (request.activityDate) {
                const parsedDate = new Date(request.activityDate);
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

            const id = String(request.id || '').toLowerCase();
            const category = String(request.category || '').toLowerCase();
            const address = String(request.address || '').toLowerCase();
            const pinCode = String(request.pinCode || '').toLowerCase();
            const description = String(request.description || '').toLowerCase();
            const type = String(request.requestLabel || '').toLowerCase();
            const cancellationReason = String(request.cancellationReason || '').toLowerCase();

            return id.includes(normalizedSearch)
                || category.includes(normalizedSearch)
                || address.includes(normalizedSearch)
                || pinCode.includes(normalizedSearch)
                || description.includes(normalizedSearch)
                || type.includes(normalizedSearch)
                || cancellationReason.includes(normalizedSearch);
        });

        return [...matches].sort((left, right) => {
            if (sortBy === 'CATEGORY') {
                return String(left.category || '').localeCompare(String(right.category || ''));
            }

            if (sortBy === 'STATUS') {
                return String(left.status || '').localeCompare(String(right.status || ''));
            }

            if (sortBy === 'TYPE') {
                return String(left.requestLabel || '').localeCompare(String(right.requestLabel || ''));
            }

            if (sortBy === 'OLDEST') {
                return new Date(left.activityDate || 0).getTime() - new Date(right.activityDate || 0).getTime();
            }

            return new Date(right.activityDate || 0).getTime() - new Date(left.activityDate || 0).getTime();
        });
    }, [endDate, requests, searchTerm, sortBy, startDate, statusFilter, typeFilter]);

    const sortedRequests = useMemo(() => {
        const { key, direction } = sortConfig;

        const sorted = [...filteredRequests].sort((left, right) => {
            let leftValue;
            let rightValue;

            if (key === 'activityDate') {
                leftValue = new Date(left.activityDate || 0).getTime();
                rightValue = new Date(right.activityDate || 0).getTime();
            } else if (key === 'id') {
                leftValue = String(left.id || '');
                rightValue = String(right.id || '');
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
    }, [filteredRequests, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(sortedRequests.length / pageSize));
    const currentPage = Math.min(page, totalPages);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedRequests.slice(startIndex, startIndex + pageSize);
    }, [currentPage, pageSize, sortedRequests]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, sortBy, statusFilter, startDate, endDate, sortConfig, pageSize, typeFilter]);

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

    const allVisibleSelected = paginatedRequests.length > 0
        && paginatedRequests.every((request) => selectedKeys.includes(getRequestKey(request)));

    const toggleSelectAll = () => {
        if (allVisibleSelected) {
            setSelectedKeys((prev) => prev.filter((key) => !paginatedRequests.some((request) => getRequestKey(request) === key)));
            return;
        }

        const selectedSet = new Set(selectedKeys);
        paginatedRequests.forEach((request) => selectedSet.add(getRequestKey(request)));
        setSelectedKeys(Array.from(selectedSet));
    };

    const toggleSelected = (request) => {
        const requestKey = getRequestKey(request);
        setSelectedKeys((prev) => (
            prev.includes(requestKey)
                ? prev.filter((key) => key !== requestKey)
                : [...prev, requestKey]
        ));
    };

    const updateSelected = async () => {
        if (selectedKeys.length === 0) {
            addToast('Select at least one request to update', 'error');
            return;
        }

        if (bulkStatus === 'ASSIGNED' && !assignPickerId) {
            addToast('Select a picker before bulk assigning requests', 'error');
            return;
        }

        try {
            const selectedRequests = requests.filter((request) => selectedKeys.includes(getRequestKey(request)));

            await Promise.all(selectedRequests.map((request) => {
                const payload = {
                    id: request.id,
                    status: bulkStatus,
                };

                if (bulkStatus === 'ASSIGNED') {
                    payload.assignedTo = assignPickerId;
                }

                return request.requestType === 'DUMP'
                    ? api.put('/illegals/', payload)
                    : api.put('/pickups/', payload);
            }));
            setRequests((prev) => prev.map((request) => (
                selectedKeys.includes(getRequestKey(request))
                    ? { ...request, status: bulkStatus }
                    : request
            )));
            addToast(`Updated ${selectedKeys.length} requests`, 'success');
            setSelectedKeys([]);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Bulk update failed'), 'error');
        }
    };

    const pickupCount = sortedRequests.filter((request) => request.requestType === 'PICKUP').length;
    const dumpCount = sortedRequests.filter((request) => request.requestType === 'DUMP').length;

    const requestTypeChartData = useMemo(() => {
        return [
            { label: 'Pickups', value: pickupCount, color: '#0ea5e9' },
            { label: 'Dumps', value: dumpCount, color: '#f59e0b' },
        ];
    }, [dumpCount, pickupCount]);

    const statusChartRows = useMemo(() => {
        const counts = sortedRequests.reduce((acc, request) => {
            const key = request.status || 'UNKNOWN';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts).map(([label, value], index) => ({
            label,
            value,
            color: ['#f59e0b', '#6366f1', '#0ea5e9', '#22c55e', '#ef4444', '#94a3b8'][index % 6],
        }));
    }, [sortedRequests]);

    const categoryChartRows = useMemo(() => {
        const counts = sortedRequests.reduce((acc, request) => {
            const key = request.category || (request.requestType === 'DUMP' ? 'DUMP' : 'UNKNOWN');
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts).map(([label, value], index) => ({
            label,
            value,
            color: ['#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e'][index % 6],
        }));
    }, [sortedRequests]);

    const pickerOptions = useMemo(() => {
        return pickers.map((picker) => ({
            value: picker.id,
            label: picker.phone
                ? `${picker.name} (${picker.phone})`
                : picker.name,
        })).sort((left, right) => left.label.localeCompare(right.label));
    }, [pickers]);

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
        return <div className="text-center py-12 text-slate-600">Loading pickups and dumps...</div>;
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="admin-shell p-6 sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Pickups and Dumps Operations</h1>
                        <p className="text-slate-600 mt-1">Track pickup and dump requests, apply filters, and bulk-update workflow states.</p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-secondary inline-flex items-center gap-2"
                        onClick={() => fetchRequests(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-5 mb-6">
                    <div className="lg:col-span-2 relative">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by ID, type, category, address, pin code"
                            className="input-field pl-10"
                        />
                    </div>
                    <ListboxSelect
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={[
                            { value: 'ALL', label: 'All types' },
                            { value: 'PICKUP', label: 'Pickups' },
                            { value: 'DUMP', label: 'Dumps' },
                        ]}
                        leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                    />
                    <ListboxSelect
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[{ value: 'ALL', label: 'All statuses' }, ...STATUS_OPTIONS]}
                        leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                    />
                    <ListboxSelect
                        value={sortBy}
                        onChange={setSortBy}
                        options={[
                            { value: 'NEWEST', label: 'Sort: Newest first' },
                            { value: 'OLDEST', label: 'Sort: Oldest first' },
                            { value: 'TYPE', label: 'Sort: Type' },
                            { value: 'CATEGORY', label: 'Sort: Category' },
                            { value: 'STATUS', label: 'Sort: Status' },
                        ]}
                    />
                </div>

                <div className="card p-5 border border-slate-200 bg-gradient-to-br from-slate-50 to-white mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarRange className="h-5 w-5 text-primary-600" />
                        <h3 className="font-semibold text-slate-900">Filter by Date Range</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(event) => setStartDate(event.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(event) => setEndDate(event.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Quick Select</label>
                            <div className="flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEndDate(format(new Date(), 'yyyy-MM-dd'));
                                        setStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
                                    }}
                                    className="flex-1 px-2 py-2 text-xs font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                                    title="Last 7 days"
                                >
                                    7d
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEndDate(format(new Date(), 'yyyy-MM-dd'));
                                        setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
                                    }}
                                    className="flex-1 px-2 py-2 text-xs font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                                    title="Last 30 days"
                                >
                                    30d
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEndDate(format(new Date(), 'yyyy-MM-dd'));
                                        setStartDate(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
                                    }}
                                    className="flex-1 px-2 py-2 text-xs font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                                    title="Last 90 days"
                                >
                                    90d
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
                    <div className="mb-3 pb-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-700 mb-3">
                            Bulk Assignment: Select status and picker, then choose requests
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <div className="flex-1">
                                <label className="text-xs text-slate-600 block mb-1">Status</label>
                                <ListboxSelect
                                    value={bulkStatus}
                                    onChange={setBulkStatus}
                                    options={STATUS_OPTIONS}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-slate-600 block mb-1">Picker <span className="text-red-500">*</span></label>
                                <ComboboxSelect
                                    value={assignPickerId}
                                    onChange={setAssignPickerId}
                                    options={pickerOptions}
                                    className="w-full"
                                    placeholder="Search picker..."
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-slate-600 block mb-1">Requests</label>
                                <button
                                    type="button"
                                    className="btn btn-primary w-full inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap px-4"
                                    onClick={updateSelected}
                                    disabled={selectedKeys.length === 0}
                                >
                                    <CheckCheck className="h-4 w-4" />
                                    Update {selectedKeys.length > 0 ? `(${selectedKeys.length})` : 'Selected'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            Showing <span className="font-semibold">{sortedRequests.length}</span> requests
                            {' '}(<span className="font-semibold">{pickupCount}</span> pickups, <span className="font-semibold">{dumpCount}</span> dumps)
                            {selectedKeys.length > 0 ? `, ${selectedKeys.length} selected` : ''}.
                        </p>
                    </div>
                </div>

                <div className="grid xl:grid-cols-3 gap-5 mb-6">
                    <AdminDonutChart
                        title="Request Type Mix"
                        subtitle="Current filtered pickups vs dumps"
                        totalLabel="Filtered"
                        data={requestTypeChartData}
                    />
                    <AdminBarListChart
                        title="Status Distribution"
                        subtitle="How filtered requests are progressing"
                        rows={statusChartRows}
                        maxRows={6}
                    />
                    <AdminBarListChart
                        title="Category Distribution"
                        subtitle="Top categories in filtered requests"
                        rows={categoryChartRows}
                        maxRows={6}
                    />
                </div>

                <div className="card overflow-hidden">
                    <div className="overflow-x-hidden">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-900 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-3 py-3">
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
                                            onChange={toggleSelectAll}
                                            aria-label="Select all visible requests"
                                        />
                                    </th>
                                    <th className="px-3 py-3 text-xs">{renderColumnHeader('ID', 'id')}</th>
                                    <th className="px-3 py-3">{renderColumnHeader('Type', 'requestType')}</th>
                                    <th className="px-3 py-3">{renderColumnHeader('Category', 'category')}</th>
                                    <th className="px-3 py-3">{renderColumnHeader('Address', 'address')}</th>
                                    <th className="px-3 py-3">{renderColumnHeader('Status', 'status')}</th>
                                    <th className="px-3 py-3 text-xs">{renderColumnHeader('Date', 'activityDate')}</th>
                                    <th className="px-3 py-3 w-40">Update</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedRequests.map((request) => (
                                    <tr key={getRequestKey(request)} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedKeys.includes(getRequestKey(request))}
                                                onChange={() => toggleSelected(request)}
                                                aria-label={`Select ${String(request.requestLabel || 'request').toLowerCase()} ${request.id}`}
                                            />
                                        </td>
                                        <td className="px-3 py-3 font-medium text-slate-900 text-xs">
                                            {request.id 
                                                ? `#${request.displayId}` 
                                                : <span className="text-red-600 font-semibold">❌ NO ID</span>}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${request.requestType === 'DUMP' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {request.requestType === 'DUMP' ? 'Dump' : 'Pickup'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 truncate text-xs">{request.category || (request.requestType === 'DUMP' ? 'DUMP' : 'UNKNOWN')}</td>
                                        <td className="px-3 py-3 truncate text-xs max-w-[120px]" title={request.address}>{request.address || 'N/A'}</td>
                                        <td className="px-3 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(request.status)}`}>
                                                {request.status || 'UNKNOWN'}
                                            </span>
                                            {String(request.status || '').toUpperCase() === 'CANCELLED' && request.cancellationReason ? (
                                                <p className="mt-1 text-[11px] leading-4 text-rose-700 line-clamp-2" title={request.cancellationReason}>
                                                    {request.cancellationReason}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-3 text-xs">
                                            {request.activityDate
                                                ? new Date(request.activityDate).toLocaleDateString('en-IN')
                                                : 'N/A'}
                                        </td>
                                        <td className="px-3 py-3 w-40">
                                            <button
                                                type="button"
                                                className="btn btn-secondary w-full h-10"
                                                onClick={() => navigate(`/admin/requests/update/${request.requestType}/${request.id}`)}
                                            >
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {paginatedRequests.length === 0 && (
                                    <tr>
                                        <td className="px-6 py-8 text-center text-slate-500" colSpan={8}>
                                            No pickups or dumps match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <AdminPagination
                    totalItems={sortedRequests.length}
                    page={currentPage}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                />
            </div>
        </div>
    );
}
