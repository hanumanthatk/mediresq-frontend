import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'

import { WebSocketProvider } from './context/WebSocketContext'

import { PrivateRoute, RoleRoute } from './routes/ProtectedRoute'

/* AUTH */

import LoginPage from './pages/auth/LoginPage'

import RegisterPage from './pages/auth/RegisterPage'

/* PATIENT */

import PatientDashboard from './pages/patient/PatientDashboard'

import FindHospitals from './pages/patient/FindHospitals'

import EmergencyRequest from './pages/patient/EmergencyRequest'

import RequestHistory from './pages/patient/RequestHistory'

/* HOSPITAL */

import HospitalDashboard from './pages/hospital/HospitalDashboard'

import BedManagement from './pages/hospital/BedManagement'

import AmbulanceManagement from './pages/hospital/AmbulanceManagement'

import EmergencyManagement from './pages/hospital/EmergencyManagement'

import HospitalSetup from './pages/hospital/HospitalSetup'

/* ADMIN */

import AdminDashboard from './pages/admin/AdminDashboard'

import ManageHospitals from './pages/admin/ManageHospitals'

import ManageUsers from './pages/admin/ManageUsers'

import AllRequests from './pages/admin/AllRequests'

export default function App() {

  return (

    <BrowserRouter>

      <AuthProvider>

        <WebSocketProvider>

          <Routes>

            {/* PUBLIC ROUTES */}

            <Route

              path="/"

              element={<Navigate to="/login" replace />}

            />

            <Route

              path="/login"

              element={<LoginPage />}

            />

            <Route

              path="/register"

              element={<RegisterPage />}

            />

            {/* =======================================
                PATIENT ROUTES
            ======================================== */}

            <Route

              path="/patient/dashboard"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['PATIENT']}>

                    <PatientDashboard />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            <Route

              path="/patient/hospitals"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['PATIENT']}>

                    <FindHospitals />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            <Route

              path="/patient/emergency"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['PATIENT']}>

                    <EmergencyRequest />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            <Route

              path="/patient/history"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['PATIENT']}>

                    <RequestHistory />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            {/* =======================================
                HOSPITAL ROUTES
            ======================================== */}

            <Route

              path="/hospital/setup"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['HOSPITAL']}>

                    <HospitalSetup />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            <Route

              path="/hospital/dashboard"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['HOSPITAL']}>

                    <HospitalDashboard />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            <Route

              path="/hospital/beds"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['HOSPITAL']}>

                    <BedManagement />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            <Route

              path="/hospital/ambulances"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['HOSPITAL']}>

                    <AmbulanceManagement />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            <Route

              path="/hospital/emergency"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['HOSPITAL']}>

                    <EmergencyManagement />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            {/* =======================================
                ADMIN ROUTES
            ======================================== */}

            <Route

              path="/admin/dashboard"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['ADMIN']}>

                    <AdminDashboard />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            <Route

              path="/admin/hospitals"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['ADMIN']}>

                    <ManageHospitals />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            <Route

              path="/admin/users"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['ADMIN']}>

                    <ManageUsers />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            <Route

              path="/admin/requests"

              element={

                <PrivateRoute>

                  <RoleRoute allowedRoles={['ADMIN']}>

                    <AllRequests />

                  </RoleRoute>

                </PrivateRoute>

              }

            />

            {/* FALLBACK */}

            <Route

              path="*"

              element={<Navigate to="/login" replace />}

            />

          </Routes>

        </WebSocketProvider>

      </AuthProvider>

    </BrowserRouter>

  )

}