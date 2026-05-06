import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Loader from './components/Loader';

const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./pages/Teacher/TeacherDashboard'));
const ParentDashboard = lazy(() => import('./pages/Parent/ParentDashboard'));
const Profile = lazy(() => import('./pages/Profile'));

import axios from 'axios';

const PrivateRoute = ({ children, role }) => {
  const userRole = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (role && userRole !== role) {
    return <Navigate to={`/${userRole.toLowerCase()}-dashboard`} />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/admin-dashboard/*" 
            element={
              <PrivateRoute role="ADMIN">
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/teacher-dashboard/*" 
            element={
              <PrivateRoute role="TEACHER">
                <TeacherDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/parent-dashboard/*" 
            element={
              <PrivateRoute role="PARENT">
                <ParentDashboard />
              </PrivateRoute>
            } 
          />
  
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
  
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
