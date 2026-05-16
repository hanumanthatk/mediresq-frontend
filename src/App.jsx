import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WebSocketProvider } from './context/WebSocketContext'
import { PrivateRoute, RoleRoute } from './routes/ProtectedRoute'

// Auth
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Patient
import PatientDashboard  from './pages/patient/PatientDashboard'
import FindHospitals     from './pages/patient/FindHospitals'
import EmergencyRequest  from './pages/patient/EmergencyRequest'
import RequestHistory    from './pages/patient/RequestHistory'

// Hospital
import HospitalDashboard   from './pages/hospital/HospitalDashboard'
import BedManagement       from './pages/hospital/BedManagement'
import AmbulanceManagement from './pages/hospital/AmbulanceManagement'
import EmergencyManagement from './pages/hospital/EmergencyManagement'
import HospitalSetup       from './pages/hospital/HospitalSetup'

// Admin
import AdminDashboard  from './pages/admin/AdminDashboard'
import ManageHospitals from './pages/admin/ManageHospitals'
import ManageUsers     from './pages/admin/ManageUsers'
import AllRequests     from './pages/admin/AllRequests'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <Routes>
            {/* Public */}
            <Route path="/"          element={<Navigate to="/login" replace />} />
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/register"  element={<RegisterPage />} />

            {/* ── Patient ── */}
            <Route path="/patient/*" element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['PATIENT']}>
                  <Routes>
                    <Route path="dashboard"  element={<PatientDashboard />} />
                    <Route path="hospitals"  element={<FindHospitals />} />
                    <Route path="emergency"  element={<EmergencyRequest />} />
                    <Route path="history"    element={<RequestHistory />} />
                    <Route path="*"          element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </RoleRoute>
              </PrivateRoute>
            } />

            {/* ── Hospital ── */}
            <Route path="/hospital/*" element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['HOSPITAL']}>
                  <Routes>
                    <Route path="setup"      element={<HospitalSetup />} />
                    <Route path="dashboard"  element={<HospitalDashboard />} />
                    <Route path="beds"       element={<BedManagement />} />
                    <Route path="ambulances" element={<AmbulanceManagement />} />
                    <Route path="emergency"  element={<EmergencyManagement />} />
                    <Route path="*"          element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </RoleRoute>
              </PrivateRoute>
            } />

            {/* ── Admin ── */}
            <Route path="/admin/*" element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <Routes>
                    <Route path="dashboard"  element={<AdminDashboard />} />
                    <Route path="hospitals"  element={<ManageHospitals />} />
                    <Route path="users"      element={<ManageUsers />} />
                    <Route path="requests"   element={<AllRequests />} />
                    <Route path="*"          element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </RoleRoute>
              </PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
