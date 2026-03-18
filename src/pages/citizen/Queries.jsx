import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ListboxSelect from '../../components/ListboxSelect';
import { getApiErrorMessage } from '../../utils/apiError';
import { MessageSquarePlus, RefreshCw } from 'lucide-react';

const REQUEST_TYPE_OPTIONS = [
    { value: 'PICKUP', label: 'Pickup Request' },
    { value: 'DUMP', label: 'Dump Report' },
];

const PRIORITY_OPTIONS = [
    { value: 'LOW', label: 'LOW' },
    { value: 'NORMAL', label: 'NORMAL' },
    { value: 'HIGH', label: 'HIGH' },
    { value: 'CRITICAL', label: 'CRITICAL' },
];

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'All statuses' },
    { value: 'OPEN', label: 'OPEN' },
    { value: 'IN_REVIEW', label: 'IN_REVIEW' },
    { value: 'RESOLVED', label: 'RESOLVED' },
    { value: 'CLOSED', label: 'CLOSED' },
];

function buildTypeOptions(requestType, pickupRequests, dumpRequests) {
    const source = requestType === 'DUMP' ? dumpRequests : pickupRequests;
    return source.map((item) => ({
        value: item.id,
        label: `#${String(item.id || '').slice(-6)} - ${item.address || item.description || 'Request'}`,
    }));
}

function statusBadgeClass(status) {
    if (status === 'RESOLVED') {
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }

    if (status === 'CLOSED') {
        return 'bg-slate-200 text-slate-700 border border-slate-300';
    }

    if (status === 'IN_REVIEW') {
        return 'bg-sky-100 text-sky-700 border border-sky-200';
    }

    return 'bg-amber-100 text-amber-700 border border-amber-200';
}

export default function CitizenQueries() {
    const location = useLocation();
    const { addToast } = useToast();

    const [queries, setQueries] = useState([]);
    const [pickupRequests, setPickupRequests] = useState([]);
    const [dumpRequests, setDumpRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('OPEN');

    const initialRequestType = String(new URLSearchParams(location.search).get('requestType') || 'PICKUP').toUpperCase() === 'DUMP'
        ? 'DUMP'
        : 'PICKUP';
    const initialRequestId = new URLSearchParams(location.search).get('requestId') || '';

    const [formState, setFormState] = useState({
        requestType: initialRequestType,
        requestId: initialRequestId,
        subject: '',
        message: '',
        priority: 'NORMAL',
    });

    const fetchData = async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [{ data: queriesData }, { data: pickupsData }, { data: dumpsData }] = await Promise.all([
                api.get('/queries/'),
                api.get('/pickups/'),
                api.get('/illegals/'),
            ]);

            setQueries(Array.isArray(queriesData) ? queriesData : []);
            setPickupRequests(Array.isArray(pickupsData) ? pickupsData : []);
            setDumpRequests(Array.isArray(dumpsData) ? dumpsData : []);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to load your queries'), 'error');
            setQueries([]);
            setPickupRequests([]);
            setDumpRequests([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const requestIdOptions = useMemo(() => {
        return buildTypeOptions(formState.requestType, pickupRequests, dumpRequests);
    }, [dumpRequests, formState.requestType, pickupRequests]);

    const filteredQueries = useMemo(() => {
        if (statusFilter === 'ALL') {
            return queries;
        }
        return queries.filter((query) => String(query.status || '').toUpperCase() === statusFilter);
    }, [queries, statusFilter]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formState.requestId) {
            addToast('Please choose a request ID', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/queries/', {
                requestType: formState.requestType,
                requestId: formState.requestId,
                subject: formState.subject,
                message: formState.message,
                priority: formState.priority,
            });

            addToast('Your query has been raised successfully', 'success');
            setFormState((prev) => ({
                ...prev,
                subject: '',
                message: '',
                priority: 'NORMAL',
            }));
            fetchData(true);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to raise query'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-600">Loading query center...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="card p-6 h-full">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Raise a Query</h1>
                            <p className="text-sm text-slate-600 mt-1">Report an issue related to your pickup or dump request.</p>
                        </div>
                        <MessageSquarePlus className="h-5 w-5 text-primary-600" />
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <ListboxSelect
                            label="Request Type"
                            value={formState.requestType}
                            onChange={(next) => setFormState((prev) => ({
                                ...prev,
                                requestType: next,
                                requestId: '',
                            }))}
                            options={REQUEST_TYPE_OPTIONS}
                        />

                        <ListboxSelect
                            label="Request"
                            value={formState.requestId}
                            onChange={(next) => setFormState((prev) => ({ ...prev, requestId: next }))}
                            options={requestIdOptions}
                            placeholder="Select your request"
                        />

                        <ListboxSelect
                            label="Priority"
                            value={formState.priority}
                            onChange={(next) => setFormState((prev) => ({ ...prev, priority: next }))}
                            options={PRIORITY_OPTIONS}
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                            <input
                                type="text"
                                className="input-field"
                                required
                                value={formState.subject}
                                onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))}
                                placeholder="Example: Pickup delayed for 2 days"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                            <textarea
                                rows="5"
                                className="input-field"
                                required
                                value={formState.message}
                                onChange={(event) => setFormState((prev) => ({ ...prev, message: event.target.value }))}
                                placeholder="Explain your issue in detail so admin can resolve quickly."
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Query'}
                        </button>
                    </form>
                </div>

                <div className="card p-6 h-full">
                    <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">My Queries</h2>
                            <p className="text-sm text-slate-600 mt-1">Track admin responses and resolution updates.</p>
                        </div>
                        <button
                            type="button"
                            className="btn btn-secondary inline-flex items-center gap-2"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>

                    <div className="mb-4">
                        <ListboxSelect
                            label="Filter by status"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={STATUS_OPTIONS}
                        />
                    </div>

                    <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
                        {filteredQueries.length === 0 ? (
                            <div className="text-sm text-slate-500 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                No queries found for this filter.
                            </div>
                        ) : filteredQueries.map((query) => (
                            <div key={query.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{query.subject}</p>
                                        <p className="text-xs text-slate-500 mt-1">{query.requestType} #{String(query.requestId || '').slice(-6)}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadgeClass(String(query.status || 'OPEN'))}`}>
                                        {query.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{query.message}</p>
                                <p className="text-xs text-slate-500 mt-2">Priority: {query.priority}</p>
                                <p className="text-xs text-slate-500 mt-1">Raised: {query.createdAt ? new Date(query.createdAt).toLocaleString() : 'N/A'}</p>

                                {query.adminResponse ? (
                                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                        <p className="text-xs font-semibold text-emerald-800">Admin Response</p>
                                        <p className="text-sm text-emerald-900 mt-1 whitespace-pre-wrap">{query.adminResponse}</p>
                                        <p className="text-xs text-emerald-700 mt-1">
                                            Resolved by {query.resolvedByName || 'Admin'} on {query.resolvedAt ? new Date(query.resolvedAt).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
