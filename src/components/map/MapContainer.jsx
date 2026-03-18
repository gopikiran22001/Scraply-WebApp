import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { AlertTriangle, Compass, Loader2, Moon, Sun } from 'lucide-react';

const STYLE_OPTIONS = {
    light: {
        label: 'Light',
        url: String(import.meta.env.VITE_MAP_STYLE_LIGHT || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json').trim(),
        icon: Sun,
    },
    dark: {
        label: 'Dark',
        url: String(import.meta.env.VITE_MAP_STYLE_DARK || 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json').trim(),
        icon: Moon,
    },
    voyager: {
        label: 'Voyager',
        url: String(import.meta.env.VITE_MAP_STYLE_VOYAGER || 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json').trim(),
        icon: Compass,
    },
};

const STYLE_SEQUENCE = ['light', 'dark', 'voyager'];

function isValidLngLat(point) {
    return Array.isArray(point) && point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]);
}

export default function MapContainer({
    initialCenter,
    initialZoom = 5,
    className = '',
    onMapReady,
    onMapError,
    children,
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [styleKey, setStyleKey] = useState('light');
    const [isMapReady, setIsMapReady] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [styleRevision, setStyleRevision] = useState(0);
    const onMapReadyRef = useRef(onMapReady);
    const onMapErrorRef = useRef(onMapError);
    const initialCenterRef = useRef(isValidLngLat(initialCenter) ? initialCenter : [78.9629, 20.5937]);
    const initialZoomRef = useRef(initialZoom);
    const initialStyleRef = useRef(STYLE_OPTIONS.light.url);
    const currentStyleRef = useRef(STYLE_OPTIONS.light.url);

    useEffect(() => {
        onMapReadyRef.current = onMapReady;
        onMapErrorRef.current = onMapError;
    }, [onMapReady, onMapError]);

    const selectedStyle = STYLE_OPTIONS[styleKey]?.url || STYLE_OPTIONS.light.url;

    useEffect(() => {
        if (!containerRef.current || mapRef.current) {
            return;
        }

        let isDisposed = false;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: initialStyleRef.current,
            center: initialCenterRef.current,
            zoom: initialZoomRef.current,
            pitch: 35,
            bearing: -8,
            antialias: true,
        });

        mapRef.current = map;

        const navControl = new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true });
        const locateControl = new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserLocation: true,
        });

        map.addControl(navControl, 'top-right');
        map.addControl(locateControl, 'top-right');

        const onLoad = () => {
            if (isDisposed) {
                return;
            }

            setIsMapReady(true);
            setMapInstance(map);
            setStyleRevision((value) => value + 1);
            onMapReadyRef.current?.(map);
        };

        const onStyleLoad = () => {
            if (isDisposed) {
                return;
            }

            setMapInstance(map);
            setStyleRevision((value) => value + 1);
            onMapReadyRef.current?.(map);
        };

        const onErrorEvent = (event) => {
            if (isDisposed || !event?.error) {
                return;
            }

            const message = event.error?.message || 'Map failed to initialize';
            setErrorMessage(message);
            onMapErrorRef.current?.(event.error);
        };

        map.on('load', onLoad);
        map.on('style.load', onStyleLoad);
        map.on('error', onErrorEvent);

        const onResize = () => map.resize();
        window.addEventListener('resize', onResize);

        return () => {
            isDisposed = true;
            window.removeEventListener('resize', onResize);
            map.off('load', onLoad);
            map.off('style.load', onStyleLoad);
            map.off('error', onErrorEvent);
            setIsMapReady(false);
            setMapInstance(null);
            setErrorMessage('');
            try {
                map.remove();
            } catch {
                // Ignore teardown failures while navigating away from the page.
            }
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current || !isMapReady) {
            return;
        }

        if (currentStyleRef.current === selectedStyle) {
            return;
        }

        currentStyleRef.current = selectedStyle;
        mapRef.current.setStyle(selectedStyle);
    }, [isMapReady, selectedStyle]);

    const StyleIcon = STYLE_OPTIONS[styleKey]?.icon || Sun;

    return (
        <div className={`map-neo-shell ${className}`}>
            <div className="map-neo-backdrop" />
            <div className="map-neo-frame relative h-full min-h-[420px] w-full">
                <div ref={containerRef} className="h-full w-full" />

                {!isMapReady && !errorMessage ? (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm">
                        <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-white shadow-xl">
                            <p className="text-sm font-semibold flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Initializing live map...
                            </p>
                            <div className="mt-3 h-2 w-52 overflow-hidden rounded-full bg-white/20">
                                <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-300" />
                            </div>
                        </div>
                    </div>
                ) : null}

                {errorMessage ? (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
                        <div className="max-w-sm rounded-2xl border border-red-300/30 bg-white p-5 shadow-2xl">
                            <div className="flex items-start gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold">Map unavailable</p>
                                    <p className="text-xs text-slate-600 mt-1">{errorMessage}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="pointer-events-none absolute left-4 top-4 z-30 flex items-center gap-2">
                    <span className="map-status-chip map-status-chip-ready pointer-events-auto">
                        <Compass className="h-3.5 w-3.5" /> MapLibre Live
                    </span>
                </div>

                <div className="absolute left-4 top-14 z-30">
                    <button
                        type="button"
                        onClick={() => {
                            const currentIndex = STYLE_SEQUENCE.indexOf(styleKey);
                            const nextIndex = (currentIndex + 1) % STYLE_SEQUENCE.length;
                            setStyleKey(STYLE_SEQUENCE[nextIndex]);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur"
                    >
                        <StyleIcon className="h-3.5 w-3.5" />
                        {STYLE_OPTIONS[styleKey]?.label || 'Style'}
                    </button>
                </div>

                <div className="map-fade-top" />
                <div className="map-fade-bottom" />
            </div>

            {isMapReady && mapInstance && typeof children === 'function' ? children({ map: mapInstance, styleRevision }) : null}
        </div>
    );
}
