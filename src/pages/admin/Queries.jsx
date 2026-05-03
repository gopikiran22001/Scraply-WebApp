import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ListboxSelect from '../../components/ListboxSelect';
import { getApiErrorMessage } from '../../utils/apiError';
import { CheckCircle2, RefreshCw } from 'lucide-react';

const STATUS_FILTER_OPTIONS = [
    { value: 'ALL', label: 'All statuses' },
    { value: 'OPEN', label: 'OPEN' },
    { value: 'IN_REVIEW', label: 'IN_REVIEW' },
    { value: 'RESOLVED', label: 'RESOLVED' },
    { value: 'CLOSED', label: 'CLOSED' },
];

const REQUEST_TYPE_FILTER_OPTIONS = [
    { value: 'ALL', label: 'All request types' },
    { value: 'PICKUP', label: 'PICKUP' },
    { value: 'DUMP', label: 'DUMP' },
];

const statusBadgeClass = (status) => {
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
};

export default function AdminQueries() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('OPEN');
    const [requestTypeFilter, setRequestTypeFilter] = useState('ALL');
    const [responseDraft, setResponseDraft] = useState({});
    const [savingById, setSavingById] = useState({});

    const fetchQueries = async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const { data } = await api.get('/queries/');
            setQueries(Array.isArray(data) ? data : []);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to load support queries'), 'error');
            setQueries([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    const filteredQueries = useMemo(() => {
        return queries.filter((query) => {
            const matchesStatus = statusFilter === 'ALL' || String(query.status || '').toUpperCase() === statusFilter;
            const matchesType = requestTypeFilter === 'ALL' || String(query.requestType || '').toUpperCase() === requestTypeFilter;
            return matchesStatus && matchesType;
        });
    }, [queries, requestTypeFilter, statusFilter]);

    const handleResolve = async (queryId) => {
        const draft = String(responseDraft[queryId] || '').trim();
        if (!draft) {
            addToast('Please provide a response before resolving', 'error');
            return;
        }

        setSavingById((prev) => ({ ...prev, [queryId]: true }));
        try {
            await api.put(`/queries/${queryId}/resolve`, {
                adminResponse: draft,
            });
            addToast('Query marked as resolved', 'success');
            setResponseDraft((prev) => ({ ...prev, [queryId]: '' }));
            fetchQueries(true);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to resolve query'), 'error');
        } finally {
            setSavingById((prev) => ({ ...prev, [queryId]: false }));
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-600">Loading support queries...</div>;
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="admin-shell p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Support Queries</h1>
                        <p className="text-sm text-slate-600 mt-1">View user queries linked to pickup/dump requests and resolve them with responses.</p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-secondary inline-flex items-center gap-2"
                        onClick={() => fetchQueries(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <ListboxSelect
                        label="Filter by status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={STATUS_FILTER_OPTIONS}
                    />
                    <ListboxSelect
                        label="Filter by request type"
                        value={requestTypeFilter}
                        onChange={setRequestTypeFilter}
                        options={REQUEST_TYPE_FILTER_OPTIONS}
                    />
                </div>

                <div className="space-y-4">
                    {filteredQueries.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                            No queries found for selected filters.
                        </div>
                    ) : filteredQueries.map((query) => {
                        const isResolved = String(query.status || '').toUpperCase() === 'RESOLVED';
                        const isSaving = Boolean(savingById[query.id]);

                        return (
                            <div key={query.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="flex flex-wrap gap-3 items-start justify-between mb-3">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">{query.subject}</h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {query.requestType}
                                            {' '}
                                            <button
                                                type="button"
                                                className="text-primary-700 hover:text-primary-800 underline underline-offset-2 font-semibold"
                                                onClick={() => navigate(`/admin/requests/update/${String(query.requestType || 'PICKUP').toUpperCase()}/${query.requestId}`)}
                                            >
                                                #{String(query.requestId || '').slice(-6)}
                                            </button>
                                            {' '}• Raised by {query.createdByName || 'User'}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadgeClass(String(query.status || 'OPEN'))}`}>
                                        {query.status}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{query.message}</p>

                                <div className="mt-3 text-xs text-slate-500">
                                    <p>Priority: <span className="font-medium text-slate-700">{query.priority}</span></p>
                                    <p className="mt-1">Raised at: {query.createdAt ? new Date(query.createdAt).toLocaleString() : 'N/A'}</p>
                                </div>

                                {query.adminResponse ? (
                                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                        <p className="text-xs font-semibold text-emerald-800">Resolution</p>
                                        <p className="text-sm text-emerald-900 mt-1 whitespace-pre-wrap">{query.adminResponse}</p>
                                        <p className="text-xs text-emerald-700 mt-1">
                                            By {query.resolvedByName || 'Admin'} on {query.resolvedAt ? new Date(query.resolvedAt).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                ) : null}

                                {!isResolved ? (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Admin Response</label>
                                        <textarea
                                            rows="4"
                                            className="input-field"
                                            value={responseDraft[query.id] || ''}
                                            onChange={(event) => setResponseDraft((prev) => ({
                                                ...prev,
                                                [query.id]: event.target.value,
                                            }))}
                                            placeholder="Write the action taken and next steps for the user"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary mt-3 inline-flex items-center gap-2"
                                            onClick={() => handleResolve(query.id)}
                                            disabled={isSaving}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            {isSaving ? 'Resolving...' : 'Resolve Query'}
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
