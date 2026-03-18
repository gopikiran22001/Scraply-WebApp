import { useEffect, useMemo, useRef } from 'react';

const ACTIVE_SOURCE_ID = 'scraply-route-source-active';
const ACTIVE_CASE_LAYER_ID = 'scraply-route-case-active';
const ACTIVE_MAIN_LAYER_ID = 'scraply-route-main-active';
const INACTIVE_SOURCE_ID = 'scraply-route-source-inactive';
const INACTIVE_LAYER_ID = 'scraply-route-inactive';

function toFeatureCollection(routeCoordinates) {
    if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) {
        return {
            type: 'FeatureCollection',
            features: [],
        };
    }

    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: routeCoordinates,
                },
                properties: {},
            },
        ],
    };
}

function addSourceIfMissing(map, sourceId, data) {
    if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
            type: 'geojson',
            data,
            lineMetrics: true,
        });
    }
}

function ensureLayers(map) {
    if (!map.getLayer(INACTIVE_LAYER_ID)) {
        map.addLayer({
            id: INACTIVE_LAYER_ID,
            type: 'line',
            source: INACTIVE_SOURCE_ID,
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-color': '#64748b',
                'line-width': 4,
                'line-opacity': 0.45,
                'line-dasharray': [1, 1.6],
            },
        });
    }

    if (!map.getLayer(ACTIVE_CASE_LAYER_ID)) {
        map.addLayer({
            id: ACTIVE_CASE_LAYER_ID,
            type: 'line',
            source: ACTIVE_SOURCE_ID,
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-color': '#0f172a',
                'line-width': 9,
                'line-opacity': 0.35,
            },
        });
    }

    if (!map.getLayer(ACTIVE_MAIN_LAYER_ID)) {
        map.addLayer({
            id: ACTIVE_MAIN_LAYER_ID,
            type: 'line',
            source: ACTIVE_SOURCE_ID,
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-color': [
                    'interpolate',
                    ['linear'],
                    ['line-progress'],
                    0,
                    '#0ea5e9',
                    0.5,
                    '#22d3ee',
                    1,
                    '#2dd4bf',
                ],
                'line-width': 5.5,
                'line-opacity': 0.94,
                'line-dasharray': [2, 1],
            },
        });
    }
}

export default function RouteLayer({ map, styleRevision, routeCoordinates, inactiveRouteCoordinates = [] }) {
    const animationFrameRef = useRef(null);
    const phaseRef = useRef(0);

    const activeRouteData = useMemo(() => toFeatureCollection(routeCoordinates), [routeCoordinates]);
    const inactiveRouteData = useMemo(() => toFeatureCollection(inactiveRouteCoordinates), [inactiveRouteCoordinates]);

    useEffect(() => {
        if (!map || !map.isStyleLoaded()) {
            return;
        }

        try {
            addSourceIfMissing(map, ACTIVE_SOURCE_ID, activeRouteData);
            addSourceIfMissing(map, INACTIVE_SOURCE_ID, inactiveRouteData);
            ensureLayers(map);
        } catch {
            // Ignore layer setup errors during style teardown/navigation.
        }
    }, [map, activeRouteData, inactiveRouteData, styleRevision]);

    useEffect(() => {
        if (!map) {
            return;
        }

        try {
            if (map.getSource(ACTIVE_SOURCE_ID)) {
                map.getSource(ACTIVE_SOURCE_ID).setData(activeRouteData);
            }

            if (map.getSource(INACTIVE_SOURCE_ID)) {
                map.getSource(INACTIVE_SOURCE_ID).setData(inactiveRouteData);
            }
        } catch {
            // Ignore updates while the map is being disposed.
        }
    }, [map, activeRouteData, inactiveRouteData]);

    useEffect(() => {
        if (!map || !map.getLayer(ACTIVE_MAIN_LAYER_ID)) {
            return;
        }

        const animate = () => {
            phaseRef.current = (phaseRef.current + 0.02) % 2;
            const gap = 1 + (phaseRef.current % 0.8);
            try {
                map.setPaintProperty(ACTIVE_MAIN_LAYER_ID, 'line-dasharray', [2, gap]);
            } catch {
                animationFrameRef.current = null;
                return;
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [map, styleRevision]);

    return null;
}
