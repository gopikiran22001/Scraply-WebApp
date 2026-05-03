import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { CheckCircle, XCircle, Clock, MapPin, Route as RouteIcon, Filter, Zap, Gauge, TrendingUp } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';
import ListboxSelect from '../../components/ListboxSelect';
import CancellationReasonModal from '../../components/CancellationReasonModal';

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'REQUESTED', label: 'Requested' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const JOB_TYPE_OPTIONS = [
    { value: 'ALL', label: 'All Jobs' },
    { value: 'PICKUP', label: 'Pickup Jobs' },
    { value: 'DUMP', label: 'Dump Jobs' },
];

const ACTIVE_STATUSES = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'];

function StatusBadge({ status }) {
    const normalized = String(status || '').toUpperCase();

    if (normalized === 'COMPLETED') {
        return <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">COMPLETED</span>;
    }

    if (normalized === 'CANCELLED') {
        return <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">CANCELLED</span>;
    }

    if (normalized === 'ASSIGNED') {
        return <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">ASSIGNED</span>;
    }

    if (normalized === 'IN_PROGRESS') {
        return <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">IN PROGRESS</span>;
    }

    return <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{normalized || 'UNKNOWN'}</span>;
}

export default function CollectorDashboard() {
    const { addToast } = useToast();
    const [pickups, setPickups] = useState([]);
    const [dumps, setDumps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ASSIGNED');
    const [jobTypeFilter, setJobTypeFilter] = useState('ALL');
    const [query, setQuery] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [cancelModalJob, setCancelModalJob] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelSubmitting, setIsCancelSubmitting] = useState(false);

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

    const updatePickupStatus = async (pickupId, status, reason) => {
        try {
            const payload = { id: pickupId, status };
            if (status === 'CANCELLED') {
                payload.reason = reason;
            }

            await api.put('/pickups/', payload);
            addToast(`Pickup marked ${status}`, 'success');
            fetchJobs();
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update pickup'), 'error');
        }
    };

    const updateDumpStatus = async (dumpingId, status, reason) => {
        try {
            const payload = { id: dumpingId, status };
            if (status === 'CANCELLED') {
                payload.reason = reason;
            }

            await api.put('/illegals/', payload);
            addToast(`Dump report marked ${status}`, 'success');
            fetchJobs();
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update dump report'), 'error');
        }
    };

    const jobs = useMemo(() => {
        const normalizedPickups = pickups.map((job) => ({
            ...job,
            jobType: 'PICKUP',
            jobTitle: job.category || 'MIXED',
            jobDate: job.requestedAt || null,
        }));

        const normalizedDumps = dumps.map((job) => ({
            ...job,
            jobType: 'DUMP',
            jobTitle: job.category || 'MIXED',
            jobDate: job.reportedAt || job.requestedAt || null,
        }));

        return [...normalizedPickups, ...normalizedDumps].sort((left, right) => {
            const leftDate = left.jobDate ? new Date(left.jobDate).getTime() : 0;
            const rightDate = right.jobDate ? new Date(right.jobDate).getTime() : 0;
            return rightDate - leftDate;
        });
    }, [pickups, dumps]);

    const filteredJobs = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return jobs.filter((job) => {
            const normalizedStatus = String(job.status || '').toUpperCase();
            const matchesStatus = statusFilter === 'ALL' || normalizedStatus === statusFilter;
            const matchesType = jobTypeFilter === 'ALL' || job.jobType === jobTypeFilter;

            const searchableText = [
                job.jobTitle,
                job.address,
                job.description,
                job.landmark,
            ].join(' ').toLowerCase();
            const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

            let matchesDateRange = true;
            if (startDateFilter || endDateFilter) {
                const jobDate = job.jobDate ? new Date(job.jobDate) : null;
                if (jobDate) {
                    if (startDateFilter) {
                        const startDate = new Date(startDateFilter);
                        matchesDateRange = matchesDateRange && jobDate >= startDate;
                    }
                    if (endDateFilter) {
                        const endDate = new Date(endDateFilter);
                        endDate.setHours(23, 59, 59, 999);
                        matchesDateRange = matchesDateRange && jobDate <= endDate;
                    }
                }
            }

            return matchesStatus && matchesType && matchesQuery && matchesDateRange;
        });
    }, [jobs, statusFilter, jobTypeFilter, query, startDateFilter, endDateFilter]);

    const activeJobs = useMemo(() => jobs.filter((job) => ACTIVE_STATUSES.includes(String(job.status || '').toUpperCase())), [jobs]);
    const inProgressCount = useMemo(() => jobs.filter((job) => String(job.status || '').toUpperCase() === 'IN_PROGRESS').length, [jobs]);
    const completedCount = useMemo(() => jobs.filter((job) => String(job.status || '').toUpperCase() === 'COMPLETED').length, [jobs]);
    const completionRate = jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0;

    const pickupCount = jobs.filter((job) => job.jobType === 'PICKUP').length;
    const dumpCount = jobs.filter((job) => job.jobType === 'DUMP').length;

    const updateStatus = async (job, status, reason) => {
        if (status === 'CANCELLED' && !String(reason || '').trim()) {
            addToast('Cancellation reason is required', 'error');
            return;
        }

        if (job.jobType === 'PICKUP') {
            await updatePickupStatus(job.id, status, reason);
            return;
        }

        await updateDumpStatus(job.id, status, reason);
    };

    const onConfirmCancellation = async (reason) => {
        if (!cancelModalJob) {
            return;
        }

        const trimmedReason = String(reason || '').trim();
        if (!trimmedReason) {
            addToast('Cancellation reason is required', 'error');
            return;
        }

        setIsCancelSubmitting(true);
        try {
            await updateStatus(cancelModalJob, 'CANCELLED', trimmedReason);
            setCancelModalJob(null);
            setCancelReason('');
        } finally {
            setIsCancelSubmitting(false);
        }
    };

    const openCancelModal = (job) => {
        setCancelModalJob(job);
        setCancelReason('');
    };

    const closeCancelModal = () => {
        setCancelModalJob(null);
        setCancelReason('');
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Picker Dashboard</h1>
                    <p className="text-slate-600 mt-1">Monitor assignments, update job states, and complete routes faster.</p>
                </div>
                <Link to="/collector/map" className="btn btn-primary text-sm flex items-center gap-2 py-2.5 px-4 shadow-sm hover:shadow-md transition-shadow">
                    <MapPin className="h-4 w-4" /> Open Live Map
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
                <div className="card p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-primary-100 text-sm font-medium">Active Jobs</p>
                            <p className="text-4xl font-bold mt-2">{activeJobs.length}</p>
                            <p className="text-xs text-primary-100 mt-2">Pickup + dump assignments currently open.</p>
                        </div>
                        <Zap className="h-8 w-8 text-primary-200 opacity-75" />
                    </div>
                </div>
                <div className="card p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-amber-900 text-sm font-medium">In Progress</p>
                            <p className="text-4xl font-bold text-amber-900 mt-2">{inProgressCount}</p>
                            <p className="text-xs text-amber-700 mt-2">Jobs currently being handled.</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-amber-600 opacity-60" />
                    </div>
                </div>
                <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-green-900 text-sm font-medium">Completed</p>
                            <p className="text-4xl font-bold text-green-900 mt-2">{completedCount}</p>
                            <p className="text-xs text-green-700 mt-2">Rate: {completionRate}%</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600 opacity-60" />
                    </div>
                </div>
                <div className="card p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-slate-900 text-sm font-medium">Workload Split</p>
                            <p className="text-lg font-bold text-slate-900 mt-2">{pickupCount} Pickups</p>
                            <p className="text-lg font-bold text-slate-900">{dumpCount} Dumps</p>
                            <div className="mt-3 h-2 rounded-full overflow-hidden bg-slate-200">
                                <div className="h-full bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${jobs.length ? (pickupCount / jobs.length) * 100 : 0}%` }} />
                            </div>
                        </div>
                        <Gauge className="h-8 w-8 text-slate-600 opacity-60" />
                    </div>
                </div>
            </div>

            <div className="card p-6 border-slate-200 mb-6 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center gap-2 mb-5 text-slate-900">
                    <Filter className="h-5 w-5" />
                    <p className="text-base font-bold">Filters</p>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                    <ListboxSelect
                        label="Job Type"
                        value={jobTypeFilter}
                        onChange={setJobTypeFilter}
                        options={JOB_TYPE_OPTIONS}
                    />
                    <ListboxSelect
                        label="Status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={STATUS_OPTIONS}
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            className="input-field w-full py-2 px-3"
                            value={startDateFilter}
                            onChange={(e) => setStartDateFilter(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                            type="date"
                            className="input-field w-full py-2 px-3"
                            value={endDateFilter}
                            onChange={(e) => setEndDateFilter(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            className="input-field w-full py-2 px-3"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Address, category, landmark"
                        />
                    </div>
                </div>
            </div>

            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="inline-block h-1 w-1 rounded-full bg-primary-600"></span>
                    Assignments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredJobs.length === 0 ? (
                        <div className="card p-6 sm:p-8 text-center text-slate-500 border-dashed border-2 border-slate-200 bg-slate-50 md:col-span-2">
                            <p className="font-medium">No assignments match your current filters.</p>
                        </div>
                    ) : (
                        filteredJobs.map((job) => {
                            const isClosed = job.status === 'COMPLETED' || job.status === 'CANCELLED';

                            return (
                                <div key={`${job.jobType}-${job.id}`} className="card p-6 border-2 border-slate-200 hover:border-primary-400 hover:shadow-lg transition-all bg-gradient-to-br from-white to-slate-50 rounded-2xl">
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 flex-wrap mb-3">
                                                <p className="font-bold text-lg text-slate-900">{job.jobTitle}</p>
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${job.jobType === 'DUMP' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                                                    {job.jobType === 'DUMP' ? 'DUMP REPORT' : 'PICKUP'}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-primary-600 flex-shrink-0" /> {job.address}
                                                </p>
                                                <p className="text-sm text-slate-600">{job.description}</p>
                                                {job.landmark ? <p className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-2 py-1 inline-block">📍 {job.landmark}</p> : null}
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    🕐 {job.jobDate ? new Date(job.jobDate).toLocaleString() : 'Date unavailable'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <StatusBadge status={job.status} />
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-200 pt-4 mb-4">
                                        {job.imageUrl ? (
                                            <img src={job.imageUrl} alt="Job" className="h-28 w-28 object-cover rounded-xl border-2 border-slate-300 shadow-md hover:shadow-lg transition-shadow" />
                                        ) : null}
                                    </div>

                                    {!isClosed ? (
                                        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                                            <button onClick={() => updateStatus(job, 'COMPLETED')} className="btn btn-primary text-sm flex items-center gap-2 py-2.5 px-4 font-semibold shadow-sm hover:shadow-md transition-shadow rounded-lg">
                                                <CheckCircle className="h-4 w-4" /> {job.jobType === 'DUMP' ? 'Resolve' : 'Complete'}
                                            </button>

                                            <button onClick={() => openCancelModal(job)} className="btn btn-secondary text-sm flex items-center gap-2 py-2.5 px-4 font-semibold rounded-lg hover:bg-red-50 transition-colors">
                                                <XCircle className="h-4 w-4" /> Cancel
                                            </button>

                                            <Link to={`/collector/map?jobId=${encodeURIComponent(job.id)}&navigate=1`} className="btn btn-secondary text-sm flex items-center gap-2 py-2.5 px-4 font-semibold rounded-lg hover:bg-slate-100 transition-colors">
                                                <RouteIcon className="h-4 w-4" /> Open Route
                                            </Link>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            <div className="card p-4 mt-8 text-sm text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Status updates are saved immediately to the backend.
            </div>

            <CancellationReasonModal
                isOpen={Boolean(cancelModalJob)}
                title="Cancel Assignment"
                subjectLabel={cancelModalJob?.jobType === 'DUMP' ? 'this dump report' : 'this pickup request'}
                reason={cancelReason}
                onReasonChange={setCancelReason}
                isSubmitting={isCancelSubmitting}
                onCancel={closeCancelModal}
                onConfirm={onConfirmCancellation}
            />
        </div>
    );
}
