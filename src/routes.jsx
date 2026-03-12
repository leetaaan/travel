import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PlanningPage from "./pages/PlanningPage";
import PlanningHistoryPage from "./pages/PlanningHistoryPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AIDebugPage from "./pages/AIDebugPage";
import TripResultPage from "./pages/TripResultPage";
import ProfilePage from "./pages/ProfilePage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />
      <Route path="/ai-debug" element={<AIDebugPage />} />
      <Route path="/planning" element={<PlanningPage />} />
      <Route path="/trip-result/:id?" element={<TripResultPage />} />
      <Route path="/planning-history" element={<PlanningHistoryPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/profile/:uid?" element={<ProfilePage />} />
      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
};

export default AppRoutes;
