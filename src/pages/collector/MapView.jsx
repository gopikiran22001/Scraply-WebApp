import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../utils/apiError';
import ListboxSelect from '../../components/ListboxSelect';
import MapContainer from '../../components/map/MapContainer';
import MarkerLayer from '../../components/map/MarkerLayer';
import RouteLayer from '../../components/map/RouteLayer';
import LiveTrackingController from '../../components/map/LiveTrackingController';
import CancellationReasonModal from '../../components/CancellationReasonModal';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Crosshair, MapPin, Navigation, RotateCcw, Route, XCircle } from 'lucide-react';

const DEFAULT_CENTER = [78.9629, 20.5937];
const ACTIVE_STATUSES = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'];
const ROUTING_API_URL = String(import.meta.env.VITE_ROUTING_API_URL || 'https://router.project-osrm.org/route/v1/driving').trim();
const ROUTING_FALLBACK_URLS = [
    ROUTING_API_URL,
    'https://router.project-osrm.org/route/v1/driving',
    'https://routing.openstreetmap.de/routed-car/route/v1/driving',
];

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

function isValidCoordinate(latitude, longitude) {
    return Number.isFinite(latitude) && Number.isFinite(longitude);
}

function toLngLat(latitude, longitude) {
    if (!isValidCoordinate(latitude, longitude)) {
        return null;
    }

    return [Number(longitude), Number(latitude)];
}

function haversineDistanceKm(from, to) {
    if (!from || !to) {
        return null;
    }

    const [lon1, lat1] = from;
    const [lon2, lat2] = to;
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const deltaLat = toRad(lat2 - lat1);
    const deltaLon = toRad(lon2 - lon1);
    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function dedupeWaypoints(points) {
    const seen = new Set();

    return points.filter((point) => {
        const key = `${point[0].toFixed(6)},${point[1].toFixed(6)}`;
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function toErrorMessage(error) {
    if (!error) {
        return 'Unknown error';
    }

    if (typeof error === 'string') {
        return error;
    }

    return String(error.message || error);
}

function normalizeRoutingBaseUrl(url) {
    return String(url || '').trim().replace(/\/+$/, '');
}

function buildRoutingProviders() {
    const unique = [];
    const seen = new Set();

    for (const provider of ROUTING_FALLBACK_URLS) {
        const normalized = normalizeRoutingBaseUrl(provider);
        if (!normalized || seen.has(normalized)) {
            continue;
        }

        seen.add(normalized);
        unique.push(normalized);
    }

    return unique;
}

function fitMapToCoordinates(map, coordinates, options = {}) {
    if (!map || !Array.isArray(coordinates) || coordinates.length === 0) {
        return;
    }

    const valid = coordinates.filter((point) => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]));
    if (valid.length === 0) {
        return;
    }

    if (valid.length === 1) {
        map.flyTo({
            center: valid[0],
            zoom: options.singlePointZoom ?? 15,
            duration: options.duration ?? 850,
            essential: true,
        });
        return;
    }

    const bounds = valid.reduce(
        (result, point) => result.extend(point),
        new maplibregl.LngLatBounds(valid[0], valid[0])
    );

    map.fitBounds(bounds, {
        padding: options.padding ?? 88,
        maxZoom: options.maxZoom ?? 15.5,
        duration: options.duration ?? 900,
        essential: true,
    });
}

function buildNavigationWaypoints(currentLocation, selectedJob, filteredJobs) {
    void filteredJobs;

    if (!currentLocation || !selectedJob) {
        return [];
    }

    const selectedPoint = toLngLat(selectedJob.latitude, selectedJob.longitude);
    if (!selectedPoint) {
        return [];
    }

    // Route directly to the selected request so the path aligns with the chosen marker.
    return dedupeWaypoints([currentLocation, selectedPoint]);
}

export default function CollectorMapView() {
    const { addToast } = useToast();
    const [searchParams] = useSearchParams();
    const requestedJobId = searchParams.get('jobId');
    const shouldAutoNavigate = searchParams.get('navigate') === '1';
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ASSIGNED');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [selectedJobId, setSelectedJobId] = useState(requestedJobId || null);
    const [hoveredJobId, setHoveredJobId] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [trackerPosition, setTrackerPosition] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [routePath, setRoutePath] = useState([]);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [mapState, setMapState] = useState({ map: null, styleRevision: 0 });

    const watchIdRef = useRef(null);
    const lastRouteFetchRef = useRef(0);
    const hasAutoFramedRef = useRef(false);
    const hasRoutingErrorRef = useRef(false);

    const handleMapReady = useCallback((map) => {
        setMapState((state) => {
            if (state.map === map) {
                return state;
            }

            return {
                map,
                styleRevision: state.styleRevision + 1,
            };
        });
    }, []);

    const handleMapError = useCallback(() => {
        addToast('Map initialization failed. Check style URLs and network connectivity.', 'error');
    }, [addToast]);

    const fetchJobs = useCallback(async () => {
        try {
            const [pickupsResult, dumpsResult] = await Promise.allSettled([
                api.get('/pickups/'),
                api.get('/illegals/'),
            ]);

            const pickupData = pickupsResult.status === 'fulfilled' ? pickupsResult.value?.data : [];
            const dumpData = dumpsResult.status === 'fulfilled' ? dumpsResult.value?.data : [];

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

            if (pickupsResult.status === 'rejected' && dumpsResult.status === 'rejected') {
                addToast('Unable to load pickups and dump reports', 'error');
            } else if (pickupsResult.status === 'rejected') {
                addToast('Unable to load pickups. Showing available dump reports.', 'error');
            } else if (dumpsResult.status === 'rejected') {
                addToast('Unable to load dump reports. Showing available pickups.', 'error');
            }

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
        setSelectedJobId(requestedJobId || null);
    }, [requestedJobId]);

    useEffect(() => {
        if (!navigator.geolocation) {
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const nextPoint = [position.coords.longitude, position.coords.latitude];
                setCurrentLocation(nextPoint);
            },
            () => {
                setCurrentLocation(null);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 3000,
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

    const filteredJobs = useMemo(() => {
        return jobs
            .filter((job) => typeFilter === 'ALL' || job.jobType === typeFilter)
            .filter((job) => statusFilter === 'ALL' || String(job.status || '').toUpperCase() === statusFilter)
            .sort((left, right) => {
                const leftDate = left.jobDate ? new Date(left.jobDate).getTime() : 0;
                const rightDate = right.jobDate ? new Date(right.jobDate).getTime() : 0;
                return rightDate - leftDate;
            });
    }, [jobs, typeFilter, statusFilter]);

    const mappableJobs = useMemo(() => {
        return filteredJobs.filter((job) => isValidCoordinate(job.latitude, job.longitude));
    }, [filteredJobs]);

    const selectedJob = useMemo(() => {
        return filteredJobs.find((job) => String(job.id) === String(selectedJobId)) || null;
    }, [filteredJobs, selectedJobId]);

    const hoveredJob = useMemo(() => {
        if (!hoveredJobId) {
            return null;
        }

        return filteredJobs.find((job) => String(job.id) === String(hoveredJobId)) || null;
    }, [filteredJobs, hoveredJobId]);

    const destination = selectedJob ? toLngLat(selectedJob.latitude, selectedJob.longitude) : null;
    const routeOrigin = trackerPosition || currentLocation;
    const distanceKm = useMemo(() => haversineDistanceKm(routeOrigin, destination), [routeOrigin, destination]);
    const etaMinutes = distanceKm !== null ? Math.max(1, Math.round((distanceKm / 28) * 60)) : null;

    useEffect(() => {
        if (loading || !selectedJobId) {
            return;
        }

        if (!filteredJobs.some((job) => String(job.id) === String(selectedJobId))) {
            setSelectedJobId(null);
        }
    }, [filteredJobs, loading, selectedJobId]);

    useEffect(() => {
        if (loading || !requestedJobId || selectedJobId) {
            return;
        }

        const requestedJob = jobs.find((job) => String(job.id) === String(requestedJobId));
        if (requestedJob) {
            setSelectedJobId(requestedJob.id);
        }
    }, [jobs, loading, requestedJobId, selectedJobId]);

    useEffect(() => {
        const map = mapState.map;
        if (!map || hasAutoFramedRef.current || filteredJobs.length === 0) {
            return;
        }

        const points = mappableJobs
            .map((job) => toLngLat(job.latitude, job.longitude))
            .filter((point) => Array.isArray(point));

        if (points.length === 0) {
            return;
        }

        fitMapToCoordinates(map, points, { maxZoom: 13.8 });
        hasAutoFramedRef.current = true;
    }, [mappableJobs, mapState.map]);

    const activeJobs = filteredJobs.filter((job) => ACTIVE_STATUSES.includes(String(job.status || '').toUpperCase()));

    const focusJob = useCallback(
        (jobId) => {
            const map = mapState.map;
            const job = filteredJobs.find((item) => String(item.id) === String(jobId));
            if (!job) {
                return;
            }

            setSelectedJobId(job.id);
            const point = toLngLat(job.latitude, job.longitude);
            if (!map || !point) {
                addToast('Selected job has no valid coordinates for map focus', 'error');
                return;
            }

            map.flyTo({
                center: point,
                zoom: 15.8,
                duration: 750,
                essential: true,
            });
        },
        [filteredJobs, mapState.map]
    );

    const startNavigation = useCallback((job) => {
        const destinationPoint = toLngLat(job.latitude, job.longitude);
        if (!destinationPoint) {
            addToast('This job has no valid coordinates for navigation', 'error');
            return;
        }

        setSelectedJobId(job.id);
        setIsNavigating(true);
    }, [addToast]);

    const stopNavigation = useCallback(() => {
        setIsNavigating(false);
        setRoutePath([]);
    }, []);

    const updateSelectedJobStatus = useCallback(async (nextStatus, cancellationReason) => {
        if (!selectedJob) {
            return;
        }

        if (nextStatus === 'CANCELLED') {
            const trimmedReason = String(cancellationReason || '').trim();
            if (!trimmedReason) {
                setIsCancelModalOpen(true);
                return;
            }

            cancellationReason = trimmedReason;
        }

        if (nextStatus === 'CANCELLED') {
            setIsCancelModalOpen(false);
            setCancelReason('');
        }

        setIsUpdatingStatus(true);
        try {
            const payload = {
                id: selectedJob.id,
                status: nextStatus,
            };

            if (nextStatus === 'CANCELLED') {
                payload.reason = cancellationReason;
            }

            if (selectedJob.jobType === 'PICKUP') {
                await api.put('/pickups/', payload);
                addToast(`Pickup marked ${nextStatus}`, 'success');
            } else {
                await api.put('/illegals/', payload);
                addToast(`Dump report marked ${nextStatus}`, 'success');
            }

            if (nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED') {
                stopNavigation();
            }

            await fetchJobs();
        } catch (error) {
            addToast(getApiErrorMessage(error, 'Failed to update request status'), 'error');
        } finally {
            setIsUpdatingStatus(false);
        }
    }, [addToast, fetchJobs, selectedJob, stopNavigation]);

    const resetView = useCallback(() => {
        const map = mapState.map;
        if (!map) {
            return;
        }

        const points = mappableJobs.map((job) => toLngLat(job.latitude, job.longitude)).filter((point) => Array.isArray(point));
        if (points.length > 0) {
            fitMapToCoordinates(map, points, { padding: 90, maxZoom: 14 });
            return;
        }

        map.flyTo({ center: DEFAULT_CENTER, zoom: 5, duration: 700 });
    }, [mappableJobs, mapState.map]);

    const centerMapOnPoint = useCallback((point, zoom = 16) => {
        const map = mapState.map;
        if (!map || !Array.isArray(point)) {
            return;
        }

        map.flyTo({
            center: point,
            zoom,
            duration: 800,
            essential: true,
        });
    }, [mapState.map]);

    const onLocateMe = useCallback(() => {
        if (!navigator.geolocation) {
            addToast('Geolocation is not supported by your browser', 'error');
            return;
        }

        // If watchPosition already has a recent point, center immediately.
        if (Array.isArray(currentLocation)) {
            centerMapOnPoint(currentLocation);
        }

        const onPositionResolved = (position) => {
            const nextPoint = [position.coords.longitude, position.coords.latitude];
            setCurrentLocation(nextPoint);
            centerMapOnPoint(nextPoint);
        };

        const fallbackLowAccuracy = () => {
            navigator.geolocation.getCurrentPosition(
                onPositionResolved,
                (error) => {
                    const reason = error?.code === 1
                        ? 'Location permission denied. Please allow location access in your browser.'
                        : 'Unable to get your location. Please check device location settings.';
                    addToast(reason, 'error');
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 15000 }
            );
        };

        navigator.geolocation.getCurrentPosition(
            onPositionResolved,
            fallbackLowAccuracy,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
    }, [addToast, centerMapOnPoint, currentLocation]);

    const navigationWaypoints = useMemo(() => {
        return buildNavigationWaypoints(routeOrigin, selectedJob, filteredJobs);
    }, [routeOrigin, selectedJob, filteredJobs]);

    useEffect(() => {
        if (!selectedJob) {
            return;
        }

        const map = mapState.map;
        const point = toLngLat(selectedJob.latitude, selectedJob.longitude);
        if (map && point) {
            map.flyTo({
                center: point,
                zoom: 15.8,
                duration: 750,
                essential: true,
            });
        }

        if (shouldAutoNavigate && !isNavigating) {
            startNavigation(selectedJob);
        }
    }, [isNavigating, mapState.map, selectedJob, shouldAutoNavigate, startNavigation]);

    const isSelectedJobClosed = useMemo(() => {
        return selectedJob
            ? ['COMPLETED', 'CANCELLED'].includes(String(selectedJob.status || '').toUpperCase())
            : false;
    }, [selectedJob]);

    useEffect(() => {
        if (!isNavigating || navigationWaypoints.length < 2) {
            setRoutePath([]);
            return;
        }

        setRoutePath(navigationWaypoints);
    }, [isNavigating, navigationWaypoints]);

    useEffect(() => {
        const map = mapState.map;
        if (!map || !isNavigating || routePath.length < 2) {
            return;
        }

        fitMapToCoordinates(map, routePath, { padding: 110, maxZoom: 15 });
    }, [isNavigating, mapState.map, routePath]);

    useEffect(() => {
        const fetchRoute = async () => {
            if (!isNavigating || navigationWaypoints.length < 2) {
                return;
            }

            const now = Date.now();
            if (now - lastRouteFetchRef.current < 5000) {
                return;
            }
            lastRouteFetchRef.current = now;

            const coordinatesPath = navigationWaypoints.map((point) => `${point[0]},${point[1]}`).join(';');
            const providers = buildRoutingProviders();
            const failures = [];

            for (const provider of providers) {
                try {
                    const url = new URL(`${provider}/${coordinatesPath}`);
                    url.searchParams.set('overview', 'full');
                    url.searchParams.set('geometries', 'geojson');
                    url.searchParams.set('alternatives', 'false');
                    url.searchParams.set('steps', 'false');

                    const response = await fetch(url.toString());
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    const coordinates = data?.routes?.[0]?.geometry?.coordinates;
                    if (Array.isArray(coordinates) && coordinates.length > 1) {
                        setRoutePath(coordinates);
                        hasRoutingErrorRef.current = false;
                        return;
                    }

                    throw new Error('No route geometry returned');
                } catch (error) {
                    failures.push(`${provider}: ${toErrorMessage(error)}`);
                }
            }

            setRoutePath(navigationWaypoints);
            if (!hasRoutingErrorRef.current) {
                const details = failures.length > 0 ? ` (${failures[0]})` : '';
                addToast(`Routing provider unavailable. Showing direct path fallback.${details}`, 'error');
                hasRoutingErrorRef.current = true;
            }
        };

        fetchRoute();
    }, [addToast, isNavigating, navigationWaypoints]);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Live Assignment Map</h1>
                    <p className="text-sm text-gray-500">MapLibre-powered dispatch map for pickups and dump reports.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/collector/dashboard" className="btn btn-secondary text-sm flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                    <button type="button" onClick={onLocateMe} className="btn btn-primary text-sm flex items-center gap-1">
                        <Crosshair className="h-4 w-4" /> Locate Me
                    </button>
                    <button type="button" onClick={resetView} className="btn btn-secondary text-sm flex items-center gap-1">
                        <RotateCcw className="h-4 w-4" /> Reset View
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
                <div className="card p-4 lg:h-[74vh] overflow-hidden flex flex-col lg:sticky lg:top-24 z-30 bg-white/95 backdrop-blur">
                    <div className="grid gap-3 mb-4">
                        <ListboxSelect label="Job Type" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
                        <ListboxSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
                    </div>

                    <div className="mb-3 rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm text-gray-600">
                        <div className="font-medium text-gray-800">Visible Jobs: {filteredJobs.length}</div>
                        <div>Active in current filter: {activeJobs.length}</div>
                    </div>

                    <div className="overflow-y-auto no-scrollbar space-y-3 pr-1">
                        {loading ? <div className="text-sm text-gray-500">Loading jobs...</div> : null}
                        {!loading && filteredJobs.length === 0 ? <div className="text-sm text-gray-500">No jobs found for the selected filters.</div> : null}

                        {filteredJobs.map((job) => {
                            const isSelected = String(selectedJobId) === String(job.id);
                            const isDump = job.jobType === 'DUMP';
                            const tone = isDump ? 'text-red-600 bg-red-50 border-red-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100';

                            return (
                                <button
                                    key={`${job.jobType}-${job.id}`}
                                    type="button"
                                    onClick={() => focusJob(job.id)}
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

                <div className="space-y-3">
                    <div className="relative z-0 lg:h-[74vh]">
                        <MapContainer
                            initialCenter={DEFAULT_CENTER}
                            initialZoom={5}
                            className="h-[72vh] lg:h-full"
                            onMapReady={handleMapReady}
                            onMapError={handleMapError}
                        >
                            {({ map, styleRevision }) => (
                                <>
                                    <MarkerLayer
                                        map={map}
                                        styleRevision={styleRevision}
                                        jobs={mappableJobs}
                                        selectedJobId={selectedJobId}
                                        onSelectJob={focusJob}
                                        onHoverJob={setHoveredJobId}
                                    />
                                    <RouteLayer
                                        map={map}
                                        styleRevision={styleRevision}
                                        routeCoordinates={isNavigating ? routePath : []}
                                        inactiveRouteCoordinates={isNavigating ? navigationWaypoints : []}
                                    />
                                    <LiveTrackingController
                                        map={map}
                                        location={currentLocation}
                                        onPositionFrame={setTrackerPosition}
                                    />
                                </>
                            )}
                        </MapContainer>

                        {hoveredJob ? (
                            <div className="absolute bottom-4 left-4 z-20 max-w-sm rounded-xl border border-white/40 bg-white/90 p-3 shadow-xl backdrop-blur">
                                <p className="text-xs font-semibold text-slate-800">{hoveredJob.category || 'MIXED'} · {hoveredJob.jobTypeLabel}</p>
                                <p className="text-xs text-slate-600 mt-1 truncate">{hoveredJob.address}</p>
                            </div>
                        ) : null}
                    </div>

                    {selectedJob ? (
                        <div className="card p-4 border border-slate-200 bg-white">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`h-2.5 w-2.5 rounded-full ${selectedJob.jobType === 'DUMP' ? 'bg-red-500' : 'bg-emerald-500'}`} />
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

                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => updateSelectedJobStatus('COMPLETED')}
                                    disabled={isUpdatingStatus || isSelectedJobClosed}
                                    className="btn btn-primary text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    {selectedJob.jobType === 'DUMP' ? 'Resolve Request' : 'Complete Request'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCancelReason('');
                                        setIsCancelModalOpen(true);
                                    }}
                                    disabled={isUpdatingStatus || isSelectedJobClosed}
                                    className="btn btn-secondary text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <XCircle className="h-4 w-4" /> Cancel Request
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card p-4 text-sm text-slate-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Select a marker or job card to see navigation actions.
                        </div>
                    )}
                </div>
            </div>

            <CancellationReasonModal
                isOpen={isCancelModalOpen}
                title="Cancel Assignment"
                subjectLabel={selectedJob?.jobType === 'DUMP' ? 'this dump report' : 'this pickup request'}
                reason={cancelReason}
                onReasonChange={setCancelReason}
                isSubmitting={isUpdatingStatus}
                onCancel={() => {
                    setIsCancelModalOpen(false);
                    setCancelReason('');
                }}
                onConfirm={() => updateSelectedJobStatus('CANCELLED', cancelReason)}
            />
        </div>
    );
}
