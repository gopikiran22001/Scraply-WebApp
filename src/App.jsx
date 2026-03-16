import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Awareness from './pages/Awareness';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

// Citizen Pages
import CitizenDashboard from './pages/citizen/Dashboard';
import RequestPickup from './pages/citizen/RequestPickup';
import Pickups from './pages/citizen/Pickups';
import ReportDump from './pages/citizen/ReportDump';
import Centres from './pages/citizen/Centres';
import Points from './pages/citizen/Points';

// Collector Pages
import CollectorDashboard from './pages/collector/Dashboard';
import CollectorRoute from './pages/collector/Route';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminPickups from './pages/admin/Pickups';
import AdminCentres from './pages/admin/Centres';
import AdminReports from './pages/admin/Reports';

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
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
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
                <RequestPickup />
              </ProtectedRoute>
            } />
            <Route path="pickups" element={
              <ProtectedRoute roles={['USER', 'ADMIN']}>
                <Pickups />
              </ProtectedRoute>
            } />
            <Route path="report-dump" element={
              <ProtectedRoute roles={['USER', 'ADMIN']}>
                <ReportDump />
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
            <Route path="pickups" element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminPickups />
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
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
