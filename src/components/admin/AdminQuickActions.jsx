import React, { useMemo, useState } from 'react';
import { Bolt, Flag, NotebookPen, UserPlus } from 'lucide-react';
import ListboxSelect from '../ListboxSelect';
import ComboboxSelect from '../ComboboxSelect';

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
        const pickupItems = (Array.isArray(pickups) ? pickups : []).map((item) => {
            const requestId = String(item.id || '').trim();
            const displayId = requestId ? requestId.slice(-6) : 'NODATA';
            return {
                value: requestId || String(Math.random()),
                label: `PICKUP #${displayId} - ${item.category || 'UNKNOWN'}`,
                type: 'PICKUP',
                status: String(item.status || '').toUpperCase(),
                hasValidId: !!requestId,
            };
        });

        const reportItems = (Array.isArray(reports) ? reports : []).map((item) => {
            const requestId = String(item.id || '').trim();
            const displayId = requestId ? requestId.slice(-6) : 'NODATA';
            return {
                value: requestId || String(Math.random()),
                label: `DUMP #${displayId} - ${item.address || 'N/A'}`,
                type: 'REPORT',
                status: String(item.status || '').toUpperCase(),
                hasValidId: !!requestId,
            };
        });

        const allRequests = [...pickupItems, ...reportItems].filter((item) => ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status));
        
        // Log items without valid IDs for debugging
        const invalidItems = allRequests.filter(item => !item.hasValidId);
        if (invalidItems.length > 0) {
            console.warn('[AdminQuickActions] Found requests without valid IDs:', invalidItems);
        }
        
        return allRequests;
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
        <div className={`card p-6 border border-slate-200 h-full bg-gradient-to-br from-slate-50 to-white flex flex-col ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Bolt className="h-5 w-5 text-primary-600" /> Quick Create Actions
                </h3>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${active
                                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                            onClick={() => setActiveTab(tab.value)}
                        >
                            <Icon className="h-4 w-4" /> {tab.label}
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
                    <ComboboxSelect
                        label="Picker"
                        value={assignPickerId}
                        onChange={setAssignPickerId}
                        options={pickerOptions}
                        placeholder="Search picker..."
                        direction="up"
                    />
                    <div className="text-xs text-slate-500 flex items-center">
                        {pickerOptions.length > 0 ? `${pickerOptions.length} pickers available` : 'No pickers found in current data'}
                    </div>
                    <textarea
                        className="input-field md:col-span-2 min-h-[88px] resize-none"
                        placeholder="Assignment note (optional)"
                        value={assignNote}
                        onChange={(event) => setAssignNote(event.target.value)}
                    />
                    <button type="submit" className="btn btn-primary md:col-span-2 py-2.5 font-semibold shadow-sm hover:shadow-md transition-shadow">
                        Create Assignment
                    </button>
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
                        className="input-field md:col-span-2 min-h-[88px] resize-none"
                        placeholder="Centre note"
                        value={centreNote}
                        onChange={(event) => setCentreNote(event.target.value)}
                    />
                    <button type="submit" className="btn btn-primary md:col-span-2 py-2.5 font-semibold shadow-sm hover:shadow-md transition-shadow">
                        Create Centre Note
                    </button>
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
                        className="input-field md:col-span-2 min-h-[88px] resize-none"
                        placeholder="Escalation reason"
                        value={flagReason}
                        onChange={(event) => setFlagReason(event.target.value)}
                    />
                    <button type="submit" className="btn btn-primary md:col-span-2 py-2.5 font-semibold shadow-sm hover:shadow-md transition-shadow">
                        Create Escalation Flag
                    </button>
                </form>
            ) : null}
        </div>
    );
}
