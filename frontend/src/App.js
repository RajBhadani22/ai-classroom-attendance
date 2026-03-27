import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Navigation from './components/Navigation';
import AttendanceDashboard from './components/AttendanceDashboard';
import EnrollStudent from './components/EnrollStudent';
import MarkAttendance from './components/MarkAttendance';
import ManualReview from './components/ManualReview';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: { main: '#1976d2' },
          secondary: { main: '#dc004e' },
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navigation darkMode={darkMode} onToggleDarkMode={() => setDarkMode((d) => !d)} />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<AttendanceDashboard />} />
            <Route path="/enroll" element={<EnrollStudent />} />
            <Route path="/attendance" element={<MarkAttendance />} />
            <Route path="/review/:sessionId" element={<ManualReview />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
