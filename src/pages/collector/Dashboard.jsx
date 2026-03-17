import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { CheckCircle, XCircle, Clock, Truck, AlertTriangle, MapPin, Route as RouteIcon, Filter } from 'lucide-react';
import { getApiErrorMessage } from '../../utils/apiError';
import ListboxSelect from '../../components/ListboxSelect';

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
        return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">COMPLETED</span>;
    }

    if (normalized === 'CANCELLED') {
        return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">CANCELLED</span>;
    }

    if (normalized === 'ASSIGNED') {
        return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">ASSIGNED</span>;
    }

    if (normalized === 'IN_PROGRESS') {
        return <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">IN PROGRESS</span>;
    }

    return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{normalized || 'UNKNOWN'}</span>;
}

export default function CollectorDashboard() {
    const { addToast } = useToast();
    const [pickups, setPickups] = useState([]);
    const [dumps, setDumps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [jobTypeFilter, setJobTypeFilter] = useState('ALL');
    const [query, setQuery] = useState('');

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

    const updatePickupStatus = async (pickupId, status) => {
        try {
            await api.put('/pickups/', { id: pickupId, status });
            addToast(`Pickup marked ${status}`, 'success');
            fetchJobs();
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update pickup'), 'error');
        }
    };

    const updateDumpStatus = async (dumpingId, status) => {
        try {
            await api.put('/illegals/', { id: dumpingId, status });
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

            return matchesStatus && matchesType && matchesQuery;
        });
    }, [jobs, statusFilter, jobTypeFilter, query]);

    const activeJobs = useMemo(() => jobs.filter((job) => ACTIVE_STATUSES.includes(String(job.status || '').toUpperCase())), [jobs]);
    const inProgressCount = useMemo(() => jobs.filter((job) => String(job.status || '').toUpperCase() === 'IN_PROGRESS').length, [jobs]);
    const completedCount = useMemo(() => jobs.filter((job) => String(job.status || '').toUpperCase() === 'COMPLETED').length, [jobs]);
    const completionRate = jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0;

    const pickupCount = jobs.filter((job) => job.jobType === 'PICKUP').length;
    const dumpCount = jobs.filter((job) => job.jobType === 'DUMP').length;

    const updateStatus = async (job, status) => {
        if (job.jobType === 'PICKUP') {
            await updatePickupStatus(job.id, status);
            return;
        }

        await updateDumpStatus(job.id, status);
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Picker Dashboard</h1>
                    <p className="text-gray-600">Monitor assignments, update job states, and complete routes faster.</p>
                </div>
                <Link to="/collector/map" className="btn btn-primary text-sm flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Open Live Map
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
                <div className="card p-5 bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none">
                    <p className="text-primary-100 text-sm">Active Jobs</p>
                    <p className="text-3xl font-bold mt-1">{activeJobs.length}</p>
                    <p className="text-xs text-primary-100 mt-2">Pickup + dump assignments currently open.</p>
                </div>
                <div className="card p-5">
                    <p className="text-gray-500 text-sm">In Progress</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{inProgressCount}</p>
                    <p className="text-xs text-gray-400 mt-2">Jobs currently being handled.</p>
                </div>
                <div className="card p-5">
                    <p className="text-gray-500 text-sm">Completed</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{completedCount}</p>
                    <p className="text-xs text-gray-400 mt-2">Completion rate: {completionRate}%</p>
                </div>
                <div className="card p-5">
                    <p className="text-gray-500 text-sm">Workload Split</p>
                    <p className="text-lg font-bold text-gray-900 mt-2">{pickupCount} Pickups · {dumpCount} Dumps</p>
                    <div className="mt-3 h-2 rounded-full overflow-hidden bg-gray-100">
                        <div className="h-full bg-blue-500" style={{ width: `${jobs.length ? (pickupCount / jobs.length) * 100 : 0}%` }} />
                    </div>
                </div>
            </div>

            <div className="card p-5 mb-6">
                <div className="flex items-center gap-2 mb-4 text-gray-700">
                    <Filter className="h-4 w-4" />
                    <p className="text-sm font-medium">Filters</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            className="input-field"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Address, category, landmark"
                        />
                    </div>
                </div>
            </div>

            <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Assignments</h2>
                <div className="space-y-4">
                    {filteredJobs.length === 0 ? (
                        <div className="card p-6 text-gray-500">No assignments match your current filters.</div>
                    ) : (
                        filteredJobs.map((job) => {
                            const isClosed = job.status === 'COMPLETED' || job.status === 'CANCELLED';

                            return (
                                <div key={`${job.jobType}-${job.id}`} className="card p-5">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-gray-900">{job.jobTitle}</p>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${job.jobType === 'DUMP' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {job.jobType === 'DUMP' ? 'DUMP REPORT' : 'PICKUP'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                                                <MapPin className="h-4 w-4" /> {job.address}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">{job.description}</p>
                                            {job.landmark ? <p className="text-xs text-gray-500 mt-1">Landmark: {job.landmark}</p> : null}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {job.jobDate ? new Date(job.jobDate).toLocaleString() : 'Date unavailable'}
                                            </p>
                                        </div>
                                        <StatusBadge status={job.status} />
                                    </div>

                                    {job.imageUrl ? (
                                        <div className="mt-3">
                                            <img src={job.imageUrl} alt="Job" className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
                                        </div>
                                    ) : null}

                                    {!isClosed ? (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {String(job.status || '').toUpperCase() === 'ASSIGNED' ? (
                                                <button onClick={() => updateStatus(job, 'IN_PROGRESS')} className="btn btn-secondary text-sm flex items-center gap-1">
                                                    <Clock className="h-4 w-4" /> Start Job
                                                </button>
                                            ) : null}

                                            <button onClick={() => updateStatus(job, 'COMPLETED')} className="btn btn-primary text-sm flex items-center gap-1">
                                                <CheckCircle className="h-4 w-4" /> {job.jobType === 'DUMP' ? 'Resolve' : 'Complete'}
                                            </button>

                                            <button onClick={() => updateStatus(job, 'CANCELLED')} className="btn btn-secondary text-sm flex items-center gap-1">
                                                <XCircle className="h-4 w-4" /> Cancel
                                            </button>

                                            {job.jobType === 'PICKUP' ? (
                                                <Link to={`/collector/route/${job.id}`} className="btn btn-secondary text-sm flex items-center gap-1">
                                                    <RouteIcon className="h-4 w-4" /> Open Route
                                                </Link>
                                            ) : null}
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
        </div>
    );
}
