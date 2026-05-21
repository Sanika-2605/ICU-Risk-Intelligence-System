import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PredictionPage from './pages/PredictionPage';
import ResultPage from './pages/ResultPage';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PatientHistory from './pages/PatientHistory';
import AlertsPage from './pages/AlertsPage';
import UpdateVitalsPage from './pages/UpdateVitalsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected — Doctor */}
          <Route element={<ProtectedRoute allowedRoles={['doctor']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/predictions" element={<PredictionPage />} />
            <Route path="/prediction/result" element={<ResultPage />} />
            <Route path="/predictions/result" element={<ResultPage />} />
          </Route>

          {/* Protected — Nurse */}
          <Route element={<ProtectedRoute allowedRoles={['nurse']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/nurse/dashboard" element={<NurseDashboard />} />
            <Route path="/nurse/update-vitals" element={<UpdateVitalsPage />} />
          </Route>

          {/* Protected — Admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Protected — Shared (any authenticated role) */}
          <Route element={<ProtectedRoute allowedRoles={['doctor','nurse','admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/history" element={<PatientHistory />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
