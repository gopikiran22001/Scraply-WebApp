# Scraply Web Application

A modern, responsive React-based frontend for the Scraply waste management platform. Provides intuitive dashboards and interfaces for Citizens, Collectors, and Administrators to manage waste collection, report illegal dumping, and track activities in real-time.

## 📋 Overview

The Scraply Web App is a production-ready React 19 + Vite application featuring:

- ✅ **Multi-Role Dashboards**: Customized views for Citizens, Collectors, and Admins
- 🗺️ **Interactive Maps**: Real-time location tracking with MapLibre GL
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🔐 **Secure Authentication**: JWT-based user authentication with OAuth2 support
- 📊 **Real-time Analytics**: Live statistics and performance metrics
- 🖼️ **Image Management**: Upload and display images for pickups and reports
- ⚡ **Fast Performance**: Optimized with Vite for rapid development
- 🎨 **Modern UI**: TailwindCSS for beautiful, consistent styling

## 🚀 Installation & Setup

### Prerequisites

- **Node.js 18+**
- **npm 9+** or **yarn**
- **Modern web browser**

### Step 1: Navigate to Project

```bash
cd Scraply/"Web App"
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

Create a `.env` file in the Web App directory:

```env
# API Configuration
VITE_API_URL=http://localhost:8080
VITE_API_TIMEOUT=30000

# Map Configuration - Open Street Map based (no API key required)
VITE_MAP_STYLE_LIGHT=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
VITE_MAP_STYLE_DARK=https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
VITE_MAP_STYLE_VOYAGER=https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json

# Routing & Geocoding APIs
VITE_ROUTING_API_URL=https://router.project-osrm.org/route/v1/driving
VITE_GEOCODE_API_URL=https://nominatim.openstreetmap.org/reverse
VITE_GEOCODE_SEARCH_API_URL=https://nominatim.openstreetmap.org/search

# App Configuration
VITE_APP_NAME=Scraply
VITE_APP_VERSION=1.0.0
VITE_JWT_TOKEN_KEY=scraply_jwt_token
```

### Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at: `http://localhost:5173`

### Step 5: Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## 📖 User Roles & Features

### 👤 Citizens

**Features:**
- Create waste pickup requests
- Track pickup status in real-time
- View collection centers and recycling points
- Report illegal dumping with photo evidence
- View environmental awareness content
- Manage personal profile
- Submit and track queries

### 🚚 Collectors

**Features:**
- View assigned pickup tasks and routes
- Update task status (in progress, completed)
- View optimal route to pickup locations
- Interactive map with real-time location
- Track daily performance metrics

### 🔧 Administrators

**Features:**
- Manage all users and roles
- Monitor pickup and dump report queues
- Assign collectors to tasks
- View comprehensive analytics and reports
- Manage collection centers and recycling points

## 🏗️ Project Structure

```
Web App/
├── src/
│   ├── main.jsx                     # Vite entry point
│   ├── App.jsx                      # Main app routes
│   ├── index.css                    # Global styles
│   │
│   ├── pages/
│   │   ├── Home.jsx                 # Landing page
│   │   ├── Awareness.jsx            # Environmental content
│   │   ├── Login.jsx                # Login page
│   │   ├── Register.jsx             # User registration
│   │   ├── Profile.jsx              # User profile
│   │   ├── citizen/                 # Citizen pages
│   │   ├── collector/               # Collector pages
│   │   └── admin/                   # Admin pages
│   │
│   ├── components/
│   │   ├── Navbar.jsx               # Navigation bar
│   │   ├── ErrorBoundary.jsx        # Error handling
│   │   ├── ProtectedRoute.jsx       # Auth guard
│   │   ├── admin/                   # Admin components
│   │   ├── map/                     # Map components
│   │   └── [UI components]
│   │
│   ├── context/
│   │   ├── AuthContext.jsx          # User auth state
│   │   ├── ApiLoadingContext.jsx    # Loading state
│   │   └── ToastContext.jsx         # Notifications
│   │
│   ├── api/
│   │   └── axios.js                 # API client config
│   │
│   └── utils/
│       ├── apiError.js              # Error handling
│       ├── appConfig.js             # Configuration
│       └── geocode.js               # Geocoding
│
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── eslint.config.js
└── README.md
```

## 🔐 Authentication

### Login Flow

```
1. User enters credentials or selects Google login
   ↓
2. REST API validates and returns JWT token
   ↓
3. Token stored in AuthContext and localStorage
   ↓
4. Token included in all API requests automatically
   ↓
5. If token expires, refresh endpoint called
   ↓
6. On logout, token cleared and user redirected
```

### Protected Routes

```javascript
<ProtectedRoute>
  <CitizenDashboard />
</ProtectedRoute>

<PublicOnlyRoute>
  <Login />
</PublicOnlyRoute>
```

## 🗺️ Map Features

### MapLibre GL Integration

- **Pickup Locations**: Display on map with status
- **Collection Centers**: Show nearby centers
- **Recycling Points**: Mark on map
- **Collector Routes**: Visualize assigned routes
- **Heatmap**: Show high-activity areas
- **Search**: Find locations by address

## 📱 Responsive Design

### Breakpoints

```
Mobile:   < 640px
Tablet:   640-1024px
Desktop:  > 1024px
```

### Features

- Touch-friendly interface
- Optimized forms for mobile
- Map controls adapted for touch
- Mobile-optimized charts
- Full-featured desktop interface

## 🎨 Styling with TailwindCSS

The app uses TailwindCSS for utility-first styling:

```jsx
<div className="bg-green-500 p-4 rounded-lg shadow-lg">
  <h1 className="text-white text-2xl font-bold">Welcome</h1>
</div>
```

### Design System

- **Colors**: Green (primary), Blue (secondary)
- **Spacing**: 4px base unit
- **Typography**: System font stack
- **Shadows**: Layered depth
- **Transitions**: Smooth animations

## 🔌 API Integration

### Axios Configuration

The app automatically handles:
- JWT token addition to all requests
- CORS with credentials
- Error handling and token refresh
- Request/response interceptors

```javascript
// API calls
const response = await axios.get('/api/pickups');
const created = await axios.post('/api/pickups', data);
const updated = await axios.put(`/api/pickups/${id}`, data);
await axios.delete(`/api/pickups/${id}`);
```

### Backend Integration

This frontend integrates with the REST API:

- **Auth**: `/api/auth/*` (login, register, profile, logout)
- **Pickups**: `/api/pickups/*` (CRUD operations)
- **Dumps**: `/api/dumps/*` (report illegal dumping)
- **Analytics**: `/api/analytics/*` (dashboards and metrics)
- **Admin**: `/api/admin/*` (system management)

## 🧪 Testing & Linting

### Run Linting

```bash
npm run lint
```

Checks code quality and style consistency.

## 🚀 Building & Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview  # Preview locally
```

### Docker Deployment

Build image:
```bash
docker build -t scraply-web:latest .
docker push <docker-user>/scraply-web:latest
```

Run container:
```bash
docker run -p 3000:3000 scraply-web:latest
```

## ⚙️ Configuration Files

### Vite Config

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist'
  }
});
```

### TailwindCSS Config

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: { /* custom theme */ }
  }
};
```

### Environment Variables

Important notes:
- `VITE_API_URL` must point to running REST API backend
- Do NOT include trailing slash in `VITE_API_URL`
- Map styles are free and don't require API keys
- Backend CORS expects exact frontend origin in Rest-API secrets.properties

## 🔧 Troubleshooting

### API requests fail with CORS error

```
✓ Verify VITE_API_URL matches REST API origin
✓ Check CORS config in Rest-API/secrets.properties
✓ Ensure no trailing slash in VITE_API_URL
```

### Login redirects immediately to homepage

```
✓ Check token is saved in localStorage
✓ Verify JWT_TOKEN_KEY matches in AuthContext
✓ Ensure API response includes token
```

### Map component not rendering

```
✓ Verify map style URL is valid
✓ Check coordinates are valid latitude/longitude
✓ Ensure map container has width/height
```

### Images not loading from Cloudinary

```
✓ Check Cloudinary URLs in API response
✓ Verify Cloudinary account CORS settings
✓ Check image_url field is populated
```

## 📚 Scripts

```bash
npm run dev       # Start development server
npm run build     # Build production bundle
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## 📚 Documentation

- [React 19 Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [TailwindCSS Docs](https://tailwindcss.com)
- [MapLibre GL Docs](https://maplibre.org)
- [Axios Docs](https://axios-http.com)

### Project Documentation

- [REST API Documentation](../Rest-API/README.md)
- [AI Agent Documentation](../Agent/README.md)
- [Main Project README](../README.md)

## 🤝 Contributing

1. Create feature branch
2. Follow component structure conventions
3. Ensure responsive design
4. Test on multiple devices
5. Run linting before commit
6. Submit pull request

## 📄 License

[Specify your license here]

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**React**: 19  
**Vite**: 7  
**Node**: 18+
