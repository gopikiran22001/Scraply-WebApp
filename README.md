# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

# Scraply Web App

Frontend application for the Scraply smart waste management platform.

## Environment Variables

Create a `.env` file in this folder and set:

```
VITE_API_URL=http://localhost:8080
VITE_GEOCODE_API_URL=https://nominatim.openstreetmap.org/reverse
```

Notes:
- `VITE_API_URL` must point to the running Rest-API backend.
- Do not include a trailing slash in `VITE_API_URL`.
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
