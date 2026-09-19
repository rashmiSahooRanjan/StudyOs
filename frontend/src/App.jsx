import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import StudyTimer from './pages/StudyTimer';
import Courses from './pages/Courses';
import Exams from './pages/Exams';
import Syllabus from './pages/Syllabus';
import Questions from './pages/Questions';
import MockTests from './pages/MockTests';
import Revision from './pages/Revision';
import Mistakes from './pages/Mistakes';
import Reading from './pages/Reading';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Notes from './pages/Notes';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('studyos_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.warn("Could not fetch user dashboard data:", err);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('studyos_token');
    localStorage.removeItem('studyos_user');
    setUser(null);
    setDashboardData(null);
    setMobileSidebarOpen(false);
  };

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/register" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
          <Route path="*" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
        </Routes>
      ) : (
        <div className="app-container">
          {/* Persistent Navigation Sidebar (Desktop + Mobile Drawer) */}
          <Sidebar
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            user={user}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <div className="main-content">
            {/* Top Interactive Navbar with Focus Audio, Streak, & XP */}
            <Navbar
              dashboardData={dashboardData}
              user={user}
              onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              onLogout={handleLogout}
            />

            {/* Routed Views */}
            <Routes>
              <Route path="/" element={<Dashboard user={user} onRefreshUserData={loadUserData} />} />
              <Route path="/timer" element={<StudyTimer onSessionComplete={loadUserData} />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/syllabus" element={<Syllabus />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/mocks" element={<MockTests />} />
              <Route path="/revision" element={<Revision />} />
              <Route path="/mistakes" element={<Mistakes />} />
              <Route path="/reading" element={<Reading />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/settings" element={<Settings onUserUpdated={loadUserData} />} />
              <Route
                path="/admin"
                element={
                  user.is_admin ? (
                    <Admin user={user} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      )}
    </Router>
  );
}
