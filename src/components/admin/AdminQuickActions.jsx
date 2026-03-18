import React, { useMemo, useState } from 'react';
import { Bolt, Flag, NotebookPen, UserPlus } from 'lucide-react';
import ListboxSelect from '../ListboxSelect';

const ACTIONS_STORAGE_KEY = 'scraply_admin_quick_actions';

function readSavedActions() {
    try {
        const raw = localStorage.getItem(ACTIONS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveActions(actions) {
    localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(actions));
}

function getRequestTypeLabel(type) {
    return type === 'PICKUP' ? 'Pickups' : 'Dumps';
}

export default function AdminQuickActions({
    pickups,
    reports,
    pickers,
    onAssign,
    onNote,
    onEscalation,
    className = '',
}) {
    const [activeTab, setActiveTab] = useState('assign');
    const [actions, setActions] = useState(() => readSavedActions());

    const [assignType, setAssignType] = useState('PICKUP');
    const [assignRequestId, setAssignRequestId] = useState('');
    const [assignPickerId, setAssignPickerId] = useState('');
    const [assignNote, setAssignNote] = useState('');

    const [zonePin, setZonePin] = useState('');
    const [centreName, setCentreName] = useState('');
    const [centrePriority, setCentrePriority] = useState('NORMAL');
    const [centreNote, setCentreNote] = useState('');

    const [flagType, setFlagType] = useState('PICKUP');
    const [flagRequestId, setFlagRequestId] = useState('');
    const [flagSeverity, setFlagSeverity] = useState('HIGH');
    const [flagReason, setFlagReason] = useState('');

    const openRequests = useMemo(() => {
        const pickupItems = (Array.isArray(pickups) ? pickups : []).map((item) => ({
            value: String(item.id),
            label: `PICKUP #${String(item.id).slice(-6)} - ${item.category || 'UNKNOWN'}`,
            type: 'PICKUP',
            status: String(item.status || '').toUpperCase(),
        }));

        const reportItems = (Array.isArray(reports) ? reports : []).map((item) => ({
            value: String(item.id),
            label: `DUMP #${String(item.id).slice(-6)} - ${item.address || 'N/A'}`,
            type: 'REPORT',
            status: String(item.status || '').toUpperCase(),
        }));

        return [...pickupItems, ...reportItems].filter((item) => ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status));
    }, [pickups, reports]);

    const assignRequestOptions = useMemo(() => {
        return openRequests
            .filter((item) => item.type === assignType)
            .map((item) => ({ value: item.value, label: item.label }));
    }, [assignType, openRequests]);

    const escalationRequestOptions = useMemo(() => {
        return openRequests
            .filter((item) => item.type === (flagType === 'PICKUP' ? 'PICKUP' : 'REPORT'))
            .map((item) => ({ value: item.value, label: item.label }));
    }, [flagType, openRequests]);

    const pickerOptions = useMemo(() => {
        const source = Array.isArray(pickers) ? pickers : [];
        return source.map((picker) => ({
            value: picker.id,
            label: picker.phone ? `${picker.name} (${picker.phone})` : picker.name,
        }));
    }, [pickers]);

    const pushAction = (entry) => {
        const updated = [entry, ...actions].slice(0, 25);
        setActions(updated);
        saveActions(updated);
    };

    const handleAssignment = async (event) => {
        event.preventDefault();
        if (!assignRequestId || !assignPickerId) {
            return;
        }

        const selectedPicker = (Array.isArray(pickers) ? pickers : []).find((picker) => picker.id === assignPickerId);

        await onAssign?.({
            requestType: assignType,
            requestId: assignRequestId,
            pickerId: assignPickerId,
            pickerName: selectedPicker?.name || 'Unknown picker',
            note: assignNote.trim(),
        });

        pushAction({
            type: 'ASSIGNMENT',
            title: `${getRequestTypeLabel(assignType)} #${String(assignRequestId).slice(-6)} assigned to ${selectedPicker?.name || 'Unknown picker'}`,
            meta: selectedPicker?.phone ? `Picker phone: ${selectedPicker.phone}` : 'Picker phone not available',
            createdAt: new Date().toISOString(),
        });

        setAssignNote('');
    };

    const handleNote = async (event) => {
        event.preventDefault();
        if (!zonePin.trim() || !centreNote.trim()) {
            return;
        }

        await onNote?.({
            pinCode: zonePin.trim(),
            centreName: centreName.trim(),
            priority: centrePriority,
            note: centreNote.trim(),
        });

        pushAction({
            type: 'CENTRE_NOTE',
            title: `Centre note for pin ${zonePin.trim()}`,
            meta: `${centrePriority} priority`,
            createdAt: new Date().toISOString(),
        });

        setCentreNote('');
    };

    const handleEscalation = async (event) => {
        event.preventDefault();
        if (!flagRequestId || !flagReason.trim()) {
            return;
        }

        await onEscalation?.({
            requestType: flagType,
            requestId: flagRequestId,
            severity: flagSeverity,
            reason: flagReason.trim(),
        });

        pushAction({
            type: 'ESCALATION',
            title: `${getRequestTypeLabel(flagType)} #${String(flagRequestId).slice(-6)} flagged ${flagSeverity}`,
            meta: flagReason.trim(),
            createdAt: new Date().toISOString(),
        });

        setFlagReason('');
    };

    const tabs = [
        { value: 'assign', label: 'Assign Collector', icon: UserPlus },
        { value: 'notes', label: 'Centre Note', icon: NotebookPen },
        { value: 'flags', label: 'Escalation Flag', icon: Flag },
    ];

    return (
        <div className={`card p-5 border border-slate-200 h-full ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Bolt className="h-4 w-4 text-primary-600" /> Quick Create Actions
                </h3>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${active
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-slate-200 bg-white text-slate-600'
                                }`}
                            onClick={() => setActiveTab(tab.value)}
                        >
                            <Icon className="h-3.5 w-3.5" /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'assign' ? (
                <form className="grid gap-3 md:grid-cols-2" onSubmit={handleAssignment}>
                    <ListboxSelect
                        label="Request Type"
                        value={assignType}
                        onChange={(next) => {
                            setAssignType(next);
                            setAssignRequestId('');
                        }}
                        options={[
                            { value: 'PICKUP', label: 'Pickups' },
                            { value: 'REPORT', label: 'Dumps' },
                        ]}
                    />
                    <ListboxSelect
                        label="Request"
                        value={assignRequestId}
                        onChange={setAssignRequestId}
                        options={assignRequestOptions}
                        placeholder="Select request"
                    />
                    <ListboxSelect
                        label="Picker"
                        value={assignPickerId}
                        onChange={setAssignPickerId}
                        options={pickerOptions}
                        placeholder="Select picker"
                    />
                    <div className="text-xs text-slate-500 flex items-center">
                        {pickerOptions.length > 0 ? `${pickerOptions.length} pickers available` : 'No pickers found in current data'}
                    </div>
                    <textarea
                        className="input-field md:col-span-2 min-h-[84px]"
                        placeholder="Assignment note (optional)"
                        value={assignNote}
                        onChange={(event) => setAssignNote(event.target.value)}
                    />
                    <button type="submit" className="btn btn-primary md:col-span-2">Create Assignment</button>
                </form>
            ) : null}

            {activeTab === 'notes' ? (
                <form className="grid gap-3 md:grid-cols-2" onSubmit={handleNote}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Zone pin code"
                        value={zonePin}
                        onChange={(event) => setZonePin(event.target.value)}
                    />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Centre name (optional)"
                        value={centreName}
                        onChange={(event) => setCentreName(event.target.value)}
                    />
                    <ListboxSelect
                        value={centrePriority}
                        onChange={setCentrePriority}
                        options={[
                            { value: 'LOW', label: 'LOW' },
                            { value: 'NORMAL', label: 'NORMAL' },
                            { value: 'HIGH', label: 'HIGH' },
                        ]}
                    />
                    <div></div>
                    <textarea
                        className="input-field md:col-span-2 min-h-[84px]"
                        placeholder="Centre note"
                        value={centreNote}
                        onChange={(event) => setCentreNote(event.target.value)}
                    />
                    <button type="submit" className="btn btn-primary md:col-span-2">Create Centre Note</button>
                </form>
            ) : null}

            {activeTab === 'flags' ? (
                <form className="grid gap-3 md:grid-cols-2" onSubmit={handleEscalation}>
                    <ListboxSelect
                        label="Request Type"
                        value={flagType}
                        onChange={(next) => {
                            setFlagType(next);
                            setFlagRequestId('');
                        }}
                        options={[
                            { value: 'PICKUP', label: 'Pickups' },
                            { value: 'REPORT', label: 'Dumps' },
                        ]}
                    />
                    <ListboxSelect
                        label="Request"
                        value={flagRequestId}
                        onChange={setFlagRequestId}
                        options={escalationRequestOptions}
                        placeholder="Select request"
                    />
                    <ListboxSelect
                        label="Severity"
                        value={flagSeverity}
                        onChange={setFlagSeverity}
                        options={[
                            { value: 'HIGH', label: 'HIGH' },
                            { value: 'CRITICAL', label: 'CRITICAL' },
                            { value: 'SEVERE', label: 'SEVERE' },
                        ]}
                    />
                    <div></div>
                    <textarea
                        className="input-field md:col-span-2 min-h-[84px]"
                        placeholder="Escalation reason"
                        value={flagReason}
                        onChange={(event) => setFlagReason(event.target.value)}
                    />
                    <button type="submit" className="btn btn-primary md:col-span-2">Create Escalation Flag</button>
                </form>
            ) : null}

            <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-800 mb-2">Recent Quick Actions</p>
                <div className="space-y-2 max-h-48 overflow-auto no-scrollbar">
                    {actions.length === 0 ? (
                        <p className="text-sm text-slate-500">No actions yet.</p>
                    ) : actions.map((action, index) => (
                        <div key={`${action.createdAt}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-sm font-medium text-slate-800">{action.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{action.meta}</p>
                            <p className="text-[11px] text-slate-500 mt-1">{new Date(action.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
