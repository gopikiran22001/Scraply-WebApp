import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../utils/apiError';
import ListboxSelect from '../../components/ListboxSelect';
import { ArrowLeft, AlertTriangle, Clock, Crosshair, MapPin, Navigation, Route } from 'lucide-react';

const DEFAULT_CENTER = [20.5937, 78.9629];
const ACTIVE_STATUSES = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'];

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'REQUESTED', label: 'Requested' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
    { value: 'ALL', label: 'All Jobs' },
    { value: 'PICKUP', label: 'Pickups' },
    { value: 'DUMP', label: 'Dump Reports' },
];

function createPinIcon(color, label) {
    return L.divIcon({
        className: 'picker-map-marker',
        html: `<div style="width: 30px; height: 30px; border-radius: 999px; background: ${color}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; border: 2px solid #fff; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.35);">${label}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
}

const PICKUP_ICON = createPinIcon('#2563eb', 'P');
const DUMP_ICON = createPinIcon('#ea580c', 'D');
const CURRENT_ICON = createPinIcon('#0f172a', 'ME');

function haversineDistanceKm(from, to) {
    if (!from || !to) {
        return null;
    }

    const [lat1, lon1] = from;
    const [lat2, lon2] = to;
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const deltaLat = toRad(lat2 - lat1);
    const deltaLon = toRad(lon2 - lon1);
    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CollectorMapView() {
    const { addToast } = useToast();
    const [searchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [selectedJobId, setSelectedJobId] = useState(searchParams.get('jobId') || null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [routePath, setRoutePath] = useState([]);
    const mapRef = useRef(null);
    const watchIdRef = useRef(null);
    const lastRouteFetchRef = useRef(0);

    const fetchJobs = useCallback(async () => {
        try {
            const [{ data: pickupData }, { data: dumpData }] = await Promise.all([
                api.get('/pickups/'),
                api.get('/illegals/'),
            ]);

            const pickupJobs = (Array.isArray(pickupData) ? pickupData : []).map((job) => ({
                ...job,
                jobType: 'PICKUP',
                jobTypeLabel: 'Pickup',
                latitude: Number(job.latitude),
                longitude: Number(job.longitude),
                jobDate: job.requestedAt || null,
            }));

            const dumpJobs = (Array.isArray(dumpData) ? dumpData : []).map((job) => ({
                ...job,
                jobType: 'DUMP',
                jobTypeLabel: 'Dump Report',
                latitude: Number(job.latitude),
                longitude: Number(job.longitude),
                jobDate: job.reportedAt || job.requestedAt || null,
            }));

            setJobs([...pickupJobs, ...dumpJobs]);
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Unable to load map jobs'), 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    useEffect(() => {
        if (!navigator.geolocation) {
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                setCurrentLocation([position.coords.latitude, position.coords.longitude]);
            },
            () => {
                setCurrentLocation(null);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 10000,
            }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, []);

    const geocodedJobs = useMemo(() => {
        return jobs.filter((job) => Number.isFinite(job.latitude) && Number.isFinite(job.longitude));
    }, [jobs]);

    const filteredJobs = useMemo(() => {
        return geocodedJobs
            .filter((job) => typeFilter === 'ALL' || job.jobType === typeFilter)
            .filter((job) => statusFilter === 'ALL' || String(job.status || '').toUpperCase() === statusFilter)
            .sort((left, right) => {
                const leftDate = left.jobDate ? new Date(left.jobDate).getTime() : 0;
                const rightDate = right.jobDate ? new Date(right.jobDate).getTime() : 0;
                return rightDate - leftDate;
            });
    }, [geocodedJobs, typeFilter, statusFilter]);

    const selectedJob = useMemo(() => {
        return filteredJobs.find((job) => job.id === selectedJobId) || null;
    }, [filteredJobs, selectedJobId]);

    const destination = selectedJob ? [selectedJob.latitude, selectedJob.longitude] : null;
    const distanceKm = useMemo(() => haversineDistanceKm(currentLocation, destination), [currentLocation, destination]);
    const etaMinutes = distanceKm !== null ? Math.max(1, Math.round((distanceKm / 28) * 60)) : null;

    useEffect(() => {
        if (!selectedJobId && filteredJobs.length > 0) {
            setSelectedJobId(filteredJobs[0].id);
            return;
        }

        if (selectedJobId && !filteredJobs.some((job) => job.id === selectedJobId)) {
            setSelectedJobId(filteredJobs[0]?.id || null);
        }
    }, [filteredJobs, selectedJobId]);

    useEffect(() => {
        if (!mapRef.current) {
            return;
        }

        if (isNavigating && currentLocation && destination) {
            mapRef.current.fitBounds([currentLocation, destination], { padding: [70, 70], maxZoom: 16 });
            return;
        }

        if (selectedJob) {
            mapRef.current.flyTo([selectedJob.latitude, selectedJob.longitude], 15, { duration: 0.75 });
            return;
        }

        if (currentLocation) {
            mapRef.current.flyTo(currentLocation, 14, { duration: 0.75 });
            return;
        }

        if (filteredJobs.length > 0) {
            const bounds = L.latLngBounds(filteredJobs.map((job) => [job.latitude, job.longitude]));
            mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
        }
    }, [selectedJob, currentLocation, destination, filteredJobs, isNavigating]);

    const activeJobs = filteredJobs.filter((job) => ACTIVE_STATUSES.includes(String(job.status || '').toUpperCase()));

    const startNavigation = (job) => {
        setSelectedJobId(job.id);
        setIsNavigating(true);
    };

    const stopNavigation = () => {
        setIsNavigating(false);
        setRoutePath([]);
    };

    const onLocateMe = () => {
        if (!navigator.geolocation) {
            addToast('Geolocation is not supported by your browser', 'error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const nextPosition = [position.coords.latitude, position.coords.longitude];
                setCurrentLocation(nextPosition);
                if (mapRef.current) {
                    mapRef.current.flyTo(nextPosition, 14, { duration: 0.75 });
                }
            },
            () => addToast('Unable to get your location', 'error')
        );
    };

    useEffect(() => {
        const fetchRoute = async () => {
            if (!isNavigating || !currentLocation || !destination) {
                setRoutePath([]);
                return;
            }

            const now = Date.now();
            if (now - lastRouteFetchRef.current < 6000) {
                return;
            }
            lastRouteFetchRef.current = now;

            try {
                const origin = `${currentLocation[1]},${currentLocation[0]}`;
                const target = `${destination[1]},${destination[0]}`;
                const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin};${target}?overview=full&geometries=geojson`);

                if (!response.ok) {
                    throw new Error('OSRM route fetch failed');
                }

                const data = await response.json();
                const coordinates = data?.routes?.[0]?.geometry?.coordinates;

                if (Array.isArray(coordinates) && coordinates.length > 1) {
                    setRoutePath(coordinates.map(([lon, lat]) => [lat, lon]));
                    return;
                }

                setRoutePath([currentLocation, destination]);
            } catch {
                // Fallback to direct line when route service is unavailable.
                setRoutePath([currentLocation, destination]);
            }
        };

        fetchRoute();
    }, [isNavigating, currentLocation, destination]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Live Assignment Map</h1>
                    <p className="text-sm text-gray-500">Ride-hailing style map for pickups and dump reports.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/collector/dashboard" className="btn btn-secondary text-sm flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                    <button type="button" onClick={onLocateMe} className="btn btn-primary text-sm flex items-center gap-1">
                        <Crosshair className="h-4 w-4" /> Locate Me
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-[340px_1fr] gap-4">
                <div className="card p-4 lg:h-[74vh] overflow-hidden flex flex-col">
                    <div className="grid gap-3 mb-4">
                        <ListboxSelect
                            label="Job Type"
                            value={typeFilter}
                            onChange={setTypeFilter}
                            options={TYPE_OPTIONS}
                        />
                        <ListboxSelect
                            label="Status"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={STATUS_OPTIONS}
                        />
                    </div>

                    <div className="mb-3 rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm text-gray-600">
                        <div className="font-medium text-gray-800">Visible Jobs: {filteredJobs.length}</div>
                        <div>Active in current filter: {activeJobs.length}</div>
                    </div>

                    <div className="overflow-y-auto no-scrollbar space-y-3 pr-1">
                        {loading ? <div className="text-sm text-gray-500">Loading jobs...</div> : null}
                        {!loading && filteredJobs.length === 0 ? <div className="text-sm text-gray-500">No jobs found for the selected filters.</div> : null}

                        {filteredJobs.map((job) => {
                            const isSelected = selectedJobId === job.id;
                            const isDump = job.jobType === 'DUMP';
                            const tone = isDump ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-blue-600 bg-blue-50 border-blue-100';

                            return (
                                <button
                                    key={`${job.jobType}-${job.id}`}
                                    type="button"
                                    onClick={() => setSelectedJobId(job.id)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? 'border-primary-400 bg-primary-50 shadow-sm' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{job.category || 'MIXED'}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{job.address}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${tone}`}>
                                            {job.jobTypeLabel}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{job.jobDate ? new Date(job.jobDate).toLocaleString() : 'No date'}</span>
                                    </div>

                                    <div className="mt-2 text-xs font-medium text-gray-700">{String(job.status || '').replace('_', ' ')}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative card overflow-hidden lg:h-[74vh] bg-slate-900">
                    <MapContainer
                        center={currentLocation || DEFAULT_CENTER}
                        zoom={currentLocation ? 14 : 12}
                        className="h-[72vh] lg:h-full w-full"
                        whenCreated={(mapInstance) => {
                            mapRef.current = mapInstance;
                        }}
                    >
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {currentLocation ? <Marker position={currentLocation} icon={CURRENT_ICON}><Popup>Your current location</Popup></Marker> : null}

                        {filteredJobs.map((job) => {
                            const position = [job.latitude, job.longitude];
                            const markerIcon = job.jobType === 'DUMP' ? DUMP_ICON : PICKUP_ICON;

                            return (
                                <Marker key={`${job.jobType}-${job.id}`} position={position} icon={markerIcon} eventHandlers={{ click: () => setSelectedJobId(job.id) }}>
                                    <Popup>
                                        <div className="space-y-1 min-w-[180px]">
                                            <div className="font-semibold">{job.category || 'MIXED'} ({job.jobTypeLabel})</div>
                                            <div className="text-xs text-gray-600">{job.address}</div>
                                            <button type="button" onClick={() => startNavigation(job)} className="mt-2 text-xs px-2 py-1 rounded bg-slate-900 text-white">
                                                Navigate
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {isNavigating && routePath.length > 1 ? (
                            <Polyline positions={routePath} pathOptions={{ color: '#0ea5e9', weight: 5, opacity: 0.85 }} />
                        ) : null}
                    </MapContainer>

                    <div className="pointer-events-none absolute inset-x-0 top-0 p-4 flex items-center justify-between">
                        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur">
                            <Route className="h-3.5 w-3.5" />
                            OSM Live Navigation
                        </div>
                        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur">
                            <MapPin className="h-3.5 w-3.5 text-blue-600" /> {filteredJobs.length} markers
                        </div>
                    </div>

                    {selectedJob ? (
                        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/30 bg-white/95 shadow-xl backdrop-blur p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`h-2.5 w-2.5 rounded-full ${selectedJob.jobType === 'DUMP' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                        <p className="font-semibold text-slate-900">{selectedJob.category || 'MIXED'} · {selectedJob.jobTypeLabel}</p>
                                    </div>
                                    <p className="text-sm text-slate-600 truncate">{selectedJob.address}</p>
                                    <p className="text-xs text-slate-500 mt-1 truncate">{selectedJob.description}</p>
                                </div>
                                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-full">{String(selectedJob.status || '').replace('_', ' ')}</span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {!isNavigating ? (
                                    <button type="button" onClick={() => startNavigation(selectedJob)} className="btn btn-primary text-sm flex items-center gap-1">
                                        <Navigation className="h-4 w-4" /> Start Live Navigation
                                    </button>
                                ) : (
                                    <button type="button" onClick={stopNavigation} className="btn btn-secondary text-sm flex items-center gap-1">
                                        <Route className="h-4 w-4" /> Stop Navigation
                                    </button>
                                )}
                                {distanceKm !== null ? (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">
                                        {distanceKm.toFixed(2)} km · ETA {etaMinutes} min
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/30 bg-white/95 shadow-xl backdrop-blur p-4 text-sm text-slate-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Select a marker or job card to see navigation actions.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
