import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { OverviewPage } from './pages/OverviewPage';
import { JobsExplorerPage } from './pages/JobsExplorerPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { WorkersExplorerPage } from './pages/WorkersExplorerPage';
import { WorkerDetailPage } from './pages/WorkerDetailPage';
import { ActivityPage } from './pages/ActivityPage';
import { ArchitecturePage } from './pages/ArchitecturePage';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          {/* Sidebar Navigation */}
          <Sidebar />

          {/* Main Layout Area */}
          <div className="main-wrapper">
            <Topbar />
            
            {/* View Port */}
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/jobs" element={<JobsExplorerPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/workers" element={<WorkersExplorerPage />} />
              <Route path="/workers/:id" element={<WorkerDetailPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
