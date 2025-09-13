import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home.jsx';
import GoogleCallback from './GoogleCallback.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/google-callback" element={<GoogleCallback />} />
      {/* Login page removed: login handled via Google prompt from Home */}
      {/* Dashboard removed - all functionality now in Home with automatic popups */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
