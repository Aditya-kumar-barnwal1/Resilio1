import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RescuerDashboard from './pages/RescuerDashboard.jsx';
import ProtectedRoute from './pages/ProtectedRoutes.jsx'; // 👈 Import the security guard

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/" element={<LoginPage />} />
        
        {/* 🔒 PROTECTED: AUTHORITY DASHBOARD (Only 'admin' can enter) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Officer']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* 🔒 PROTECTED: RESCUER DASHBOARD (Only 'rescuer' can enter) */}
        <Route 
          path="/rescuer" 
          element={
            <ProtectedRoute allowedRoles={['rescuer']}>
              <RescuerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all: Redirect unknown URLs to Login */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;