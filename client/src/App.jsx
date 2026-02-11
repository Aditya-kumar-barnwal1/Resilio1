import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RescuerDashboard from './pages/RescuerDashboard.jsx'; // 👈 1. Import the new page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 👈 2. Add the Rescuer Route */}
        <Route path="/rescuer" element={<RescuerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;