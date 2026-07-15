import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Cpu, Terminal, Layers } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <Layers size={18} color="#fff" />
        </div>
        <span className="logo-text">JobQueue.io</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/jobs" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Briefcase size={18} />
          <span>Jobs Explorer</span>
        </NavLink>

        <NavLink 
          to="/workers" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Cpu size={18} />
          <span>Workers Fleet</span>
        </NavLink>

        <NavLink 
          to="/activity" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Terminal size={18} />
          <span>Activity Log</span>
        </NavLink>

        <NavLink 
          to="/architecture" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Layers size={18} />
          <span>How It Works</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div>Engine v0.0.1</div>
        <div style={{ marginTop: '4px' }}>System Active</div>
      </div>
    </aside>
  );
};
