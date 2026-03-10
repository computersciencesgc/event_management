import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { EventProvider } from './context/EventContext'
import AdminDashboard from './pages/AdminDashboard'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import OrganizerDashboard from './pages/OrganizerDashboard'
import RegisterPage from './pages/RegisterPage'
import SuccessPage from './pages/SuccessPage'

function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<RegisterPage />} path="/register" />
            <Route element={<SuccessPage />} path="/success/:candidateId" />

            <Route element={<LoginPage role="admin" />} path="/admin/login" />
            <Route
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
              path="/admin"
            />

            <Route element={<LoginPage role="organizer" />} path="/organizer/login" />
            <Route
              element={
                <ProtectedRoute role="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
              path="/organizer"
            />

            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
          <footer className="app-footer">Saradha Gangadharan College</footer>
        </BrowserRouter>
      </EventProvider>
    </AuthProvider>
  )
}

export default App
