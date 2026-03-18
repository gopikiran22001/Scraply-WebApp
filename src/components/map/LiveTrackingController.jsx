import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

function isValidLngLat(location) {
    return Array.isArray(location) && location.length === 2 && Number.isFinite(location[0]) && Number.isFinite(location[1]);
}

function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function createTrackerElement() {
    const wrapper = document.createElement('div');
    wrapper.className = 'maplibre-picker-marker';

    const pulse = document.createElement('div');
    pulse.className = 'maplibre-picker-pulse';

    const icon = document.createElement('div');
    icon.className = 'maplibre-picker-icon';
    icon.textContent = 'TRK';

    wrapper.appendChild(pulse);
    wrapper.appendChild(icon);

    return wrapper;
}

export default function LiveTrackingController({ map, location, onPositionFrame }) {
    const markerRef = useRef(null);
    const lastPositionRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!map || !isValidLngLat(location)) {
            return;
        }

        if (!markerRef.current) {
            markerRef.current = new maplibregl.Marker({ element: createTrackerElement(), anchor: 'center' })
                .setLngLat(location)
                .addTo(map);
            lastPositionRef.current = location;
            onPositionFrame?.(location);
            return;
        }

        const marker = markerRef.current;
        const from = lastPositionRef.current || location;
        const to = location;

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        const startTime = performance.now();
        const duration = 1400;

        const animate = (timestamp) => {
            const progress = Math.min(1, (timestamp - startTime) / duration);
            const eased = easeInOut(progress);
            const lng = from[0] + (to[0] - from[0]) * eased;
            const lat = from[1] + (to[1] - from[1]) * eased;
            const framePoint = [lng, lat];
            try {
                marker.setLngLat(framePoint);
            } catch {
                animationRef.current = null;
                return;
            }
            onPositionFrame?.(framePoint);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            lastPositionRef.current = to;
            animationRef.current = null;
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [location, map, onPositionFrame]);

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }

            if (markerRef.current) {
                try {
                    markerRef.current.remove();
                } catch {
                    // Ignore marker teardown failures after map disposal.
                }
                markerRef.current = null;
            }
        };
    }, []);

    return null;
}
