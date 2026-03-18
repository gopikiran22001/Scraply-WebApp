import { useEffect, useMemo } from 'react';

const SOURCE_ID = 'scraply-jobs-source';
const CLUSTERS_LAYER_ID = 'scraply-jobs-clusters';
const CLUSTER_COUNT_LAYER_ID = 'scraply-jobs-cluster-count';
const PICKUP_LAYER_ID = 'scraply-jobs-pickup';
const DUMP_LAYER_ID = 'scraply-jobs-dump';
const SELECTED_LAYER_ID = 'scraply-jobs-selected';

function isValidCoordinate(latitude, longitude) {
    return Number.isFinite(latitude) && Number.isFinite(longitude);
}

function toFeature(job) {
    const latitude = Number(job.latitude);
    const longitude = Number(job.longitude);

    if (!isValidCoordinate(latitude, longitude)) {
        return null;
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
        },
        properties: {
            id: String(job.id),
            category: String(job.category || 'MIXED'),
            status: String(job.status || '').toUpperCase(),
            address: String(job.address || ''),
            jobType: String(job.jobType || 'PICKUP').toUpperCase(),
        },
    };
}

function buildFeatureCollection(jobs) {
    return {
        type: 'FeatureCollection',
        features: jobs.map(toFeature).filter(Boolean),
    };
}

function addLayerIfMissing(map, layer) {
    if (!map.getLayer(layer.id)) {
        map.addLayer(layer);
    }
}

function addSourceIfMissing(map, data) {
    if (map.getSource(SOURCE_ID)) {
        map.getSource(SOURCE_ID).setData(data);
        return;
    }

    map.addSource(SOURCE_ID, {
        type: 'geojson',
        data,
        cluster: true,
        clusterRadius: 44,
        clusterMaxZoom: 13,
    });
}

function ensureLayers(map) {
    addLayerIfMissing(map, {
        id: CLUSTERS_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#0ea5e9',
                25,
                '#0284c7',
                80,
                '#0369a1',
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                18,
                25,
                24,
                80,
                32,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
        },
    });

    addLayerIfMissing(map, {
        id: CLUSTER_COUNT_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
            'text-font': ['Open Sans Bold'],
        },
        paint: {
            'text-color': '#ffffff',
        },
    });

    addLayerIfMissing(map, {
        id: PICKUP_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'jobType'], 'PICKUP']],
        paint: {
            'circle-color': '#10b981',
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                6,
                7,
                14,
                11,
            ],
            'circle-stroke-color': '#f8fafc',
            'circle-stroke-width': 2,
            'circle-opacity': 0.95,
        },
    });

    addLayerIfMissing(map, {
        id: DUMP_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'jobType'], 'DUMP']],
        paint: {
            'circle-color': '#ef4444',
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                6,
                7,
                14,
                11,
            ],
            'circle-stroke-color': '#f8fafc',
            'circle-stroke-width': 2,
            'circle-opacity': 0.95,
        },
    });

    addLayerIfMissing(map, {
        id: SELECTED_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['get', 'id'], ''],
        paint: {
            'circle-color': 'rgba(255,255,255,0)',
            'circle-radius': 17,
            'circle-stroke-color': '#facc15',
            'circle-stroke-width': 3,
            'circle-stroke-opacity': 0.95,
        },
    });
}

export default function MarkerLayer({
    map,
    styleRevision,
    jobs,
    selectedJobId,
    onSelectJob,
    onHoverJob,
}) {
    const geojson = useMemo(() => buildFeatureCollection(jobs), [jobs]);

    useEffect(() => {
        if (!map) {
            return;
        }

        if (!map.isStyleLoaded()) {
            return;
        }

        try {
            addSourceIfMissing(map, geojson);
            ensureLayers(map);
        } catch {
            // Ignore setup errors while navigating away or reloading style.
        }
    }, [map, geojson, styleRevision]);

    useEffect(() => {
        if (!map || !map.getLayer(SELECTED_LAYER_ID)) {
            return;
        }

        const selectedId = selectedJobId ? String(selectedJobId) : '';
        try {
            map.setFilter(SELECTED_LAYER_ID, ['==', ['get', 'id'], selectedId]);
        } catch {
            // Ignore filter updates during map teardown.
        }
    }, [map, selectedJobId]);

    useEffect(() => {
        if (!map || !map.getSource(SOURCE_ID)) {
            return;
        }

        try {
            map.getSource(SOURCE_ID).setData(geojson);
        } catch {
            // Ignore source updates during map teardown.
        }
    }, [map, geojson]);

    useEffect(() => {
        if (!map) {
            return;
        }

        const interactiveLayers = [PICKUP_LAYER_ID, DUMP_LAYER_ID, CLUSTERS_LAYER_ID];

        const onMouseEnter = () => {
            map.getCanvas().style.cursor = 'pointer';
        };

        const onMouseLeave = () => {
            map.getCanvas().style.cursor = '';
            onHoverJob?.(null);
        };

        const onPointMove = (event) => {
            const feature = event.features?.[0];
            if (!feature) {
                return;
            }

            onHoverJob?.(feature.properties?.id || null);
        };

        const onPointClick = (event) => {
            const feature = event.features?.[0];
            if (!feature) {
                return;
            }

            onSelectJob?.(feature.properties?.id || null);
        };

        const onClusterClick = (event) => {
            const feature = event.features?.[0];
            if (!feature) {
                return;
            }

            const clusterId = feature.properties?.cluster_id;
            const source = map.getSource(SOURCE_ID);
            if (!source || clusterId === undefined || clusterId === null) {
                return;
            }

            source.getClusterExpansionZoom(clusterId, (error, zoom) => {
                if (error) {
                    return;
                }

                map.easeTo({
                    center: feature.geometry.coordinates,
                    zoom,
                    duration: 600,
                });
            });
        };

        try {
            interactiveLayers.forEach((layerId) => {
                map.on('mouseenter', layerId, onMouseEnter);
                map.on('mouseleave', layerId, onMouseLeave);
            });

            map.on('mousemove', PICKUP_LAYER_ID, onPointMove);
            map.on('mousemove', DUMP_LAYER_ID, onPointMove);

            map.on('click', PICKUP_LAYER_ID, onPointClick);
            map.on('click', DUMP_LAYER_ID, onPointClick);
            map.on('click', CLUSTERS_LAYER_ID, onClusterClick);
        } catch {
            return undefined;
        }

        return () => {
            try {
                interactiveLayers.forEach((layerId) => {
                    if (map.getLayer(layerId)) {
                        map.off('mouseenter', layerId, onMouseEnter);
                        map.off('mouseleave', layerId, onMouseLeave);
                    }
                });

                if (map.getLayer(PICKUP_LAYER_ID)) {
                    map.off('mousemove', PICKUP_LAYER_ID, onPointMove);
                    map.off('click', PICKUP_LAYER_ID, onPointClick);
                }

                if (map.getLayer(DUMP_LAYER_ID)) {
                    map.off('mousemove', DUMP_LAYER_ID, onPointMove);
                    map.off('click', DUMP_LAYER_ID, onPointClick);
                }

                if (map.getLayer(CLUSTERS_LAYER_ID)) {
                    map.off('click', CLUSTERS_LAYER_ID, onClusterClick);
                }
            } catch {
                // Ignore listener cleanup failures after map disposal.
            }
        };
    }, [map, onHoverJob, onSelectJob]);

    return null;
}
