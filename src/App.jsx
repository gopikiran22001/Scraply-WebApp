import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Awareness from './pages/Awareness';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

// Citizen Pages
import CitizenDashboard from './pages/citizen/Dashboard';
import RequestPickup from './pages/citizen/RequestPickup';
import Pickups from './pages/citizen/Pickups';
import Centres from './pages/citizen/Centres';
import Points from './pages/citizen/Points';
import CitizenQueries from './pages/citizen/Queries';

// Collector Pages
import CollectorDashboard from './pages/collector/Dashboard';
import CollectorRoute from './pages/collector/Route';
import CollectorMapView from './pages/collector/MapView';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminPickups from './pages/admin/Pickups';
import AdminRequestUpdate from './pages/admin/RequestUpdate';
import AdminCentres from './pages/admin/Centres';
import AdminReports from './pages/admin/Reports';
import AdminQueries from './pages/admin/Queries';
import AdminPickers from './pages/admin/Pickers';

import PageTitleUpdater from './components/PageTitleUpdater';

function App() {
  return (
    <>
      <PageTitleUpdater />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="awareness" element={<Awareness />} />
          <Route path="login" element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          } />
          <Route path="register" element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Citizen Routes */}
          <Route path="citizen">
            <Route path="dashboard" element={
              <ProtectedRoute roles={['USER', 'ADMIN']}>
                <CitizenDashboard />
              </ProtectedRoute>
            } />
            <Route path="request-pickup" element={
              <ProtectedRoute roles={['USER', 'ADMIN']}>
                <Navigate to="/citizen/request?type=pickup" replace />
              </ProtectedRoute>
            } />
            <Route path="request" element={
              <ProtectedRoute roles={['USER', 'ADMIN']}>
                <RequestPickup />
              </ProtectedRoute>
            } />
            <Route path="pickups" element={
              <ProtectedRoute roles={['USER', 'ADMIN']}>
                <Pickups />
              </ProtectedRoute>
            } />
            <Route path="queries" element={
              <ProtectedRoute roles={['USER', 'ADMIN']}>
                <CitizenQueries />
              </ProtectedRoute>
            } />
            <Route path="report-dump" element={
              <ProtectedRoute roles={['USER', 'ADMIN']}>
                <Navigate to="/citizen/request?type=dump" replace />
              </ProtectedRoute>
            } />
            <Route path="centres" element={
              <ProtectedRoute roles={['USER', 'ADMIN']}>
                <Centres />
              </ProtectedRoute>
            } />
            <Route path="points" element={
              <ProtectedRoute roles={['USER', 'ADMIN']}>
                <Points />
              </ProtectedRoute>
            } />
          </Route>

          {/* Collector Routes */}
          <Route path="collector">
            <Route path="dashboard" element={
              <ProtectedRoute roles={['PICKER', 'ADMIN']}>
                <CollectorDashboard />
              </ProtectedRoute>
            } />
            <Route path="map" element={
              <ProtectedRoute roles={['PICKER', 'ADMIN']}>
                <CollectorMapView />
              </ProtectedRoute>
            } />
            <Route path="route/:id" element={
              <ProtectedRoute roles={['PICKER', 'ADMIN']}>
                <CollectorRoute />
              </ProtectedRoute>
            } />
          </Route>

          {/* Admin Routes */}
          <Route path="admin">
            <Route path="dashboard" element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="pickers" element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminPickers />
              </ProtectedRoute>
            } />
            <Route path="centres" element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminCentres />
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminReports />
              </ProtectedRoute>
            } />
            <Route path="queries" element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminQueries />
              </ProtectedRoute>
            } />
            <Route path="pickups" element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminPickups />
              </ProtectedRoute>
            } />
            <Route path="request-update" element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminRequestUpdate />
              </ProtectedRoute>
            } />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
