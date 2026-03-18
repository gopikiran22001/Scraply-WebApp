# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

# Scraply Web App

Frontend application for the Scraply smart waste management platform.

## Environment Variables

Create a `.env` file in this folder and set:

```
VITE_API_URL=http://localhost:8080
VITE_MAP_STYLE_LIGHT=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
VITE_MAP_STYLE_DARK=https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
VITE_MAP_STYLE_VOYAGER=https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json
VITE_ROUTING_API_URL=https://router.project-osrm.org/route/v1/driving
VITE_GEOCODE_API_URL=https://nominatim.openstreetmap.org/reverse
VITE_GEOCODE_SEARCH_API_URL=https://nominatim.openstreetmap.org/search
```

Notes:
- `VITE_API_URL` must point to the running Rest-API backend.
- Do not include a trailing slash in `VITE_API_URL`.
- Map styles are URL-based and do not require proprietary map tokens.
- Backend CORS expects the exact frontend origin configured in Rest-API secrets.

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Build production assets
- `npm run preview` - Preview production build locally

## Backend Integration

This frontend integrates with:
- `/auth/*` for login, registration, profile, logout
- `/pickups/*` for pickup request lifecycle
- `/illegals/*` for illegal dumping reports lifecycle

All protected requests rely on cookie/JWT auth with `withCredentials` enabled in the axios client.
