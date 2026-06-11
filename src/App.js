// src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Medications from "./pages/Medications";
import Chat from "./pages/Chat";
import Diet from "./pages/Diet";
import Exercise from "./pages/Exercise";
import History from "./pages/History";
import Profile from "./pages/Profile";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import HealthMonitor from "./pages/HealthMonitor";

// Components
import Navbar from "./components/Navbar";

// Redux Store
import { store } from "./store/index";
import { Provider } from "react-redux";

// Toast Notifications
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Router>
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/medications" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/diet" element={<ProtectedRoute><Diet /></ProtectedRoute>} />
        <Route path="/exercise" element={<ProtectedRoute><Exercise /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/caregiver" element={<ProtectedRoute><CaregiverDashboard /></ProtectedRoute>} />
        <Route path="/health-monitor" element={<ProtectedRoute><HealthMonitor /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  );
}

export default App;