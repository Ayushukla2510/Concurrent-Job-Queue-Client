import React from 'react';
import { useApp } from '../../context/AppContext';
import { RefreshCw, Play, Pause } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { 
    isOnline, 
    isPollingActive, 
    setIsPollingActive, 
    isDemoModeActive, 
    setIsDemoModeActive,
    triggerRefresh
  } = useApp();

  return (
    <header className="topbar">
      <div className="topbar-title">
        Observability Engine
      </div>

      <div className="topbar-actions">
        {/* Connection status pill */}
        <div className="connection-badge">
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
          <span>{isOnline ? 'Backend Online' : 'Backend Offline'}</span>
        </div>

        {/* Polling Pause/Resume */}
        <button 
          className="btn btn-secondary" 
          onClick={() => setIsPollingActive(!isPollingActive)}
          style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          title={isPollingActive ? 'Pause auto-refresh' : 'Resume auto-refresh'}
        >
          {isPollingActive ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPollingActive ? 'Polling Active' : 'Polling Paused'}</span>
        </button>

        {/* Force Manual Refresh */}
        <button 
          className="btn btn-secondary" 
          onClick={triggerRefresh}
          disabled={!isPollingActive}
          style={{ padding: '6px', borderRadius: '50%' }}
          title="Force Refresh Data"
        >
          <RefreshCw size={14} className={isPollingActive ? '' : 'text-muted'} />
        </button>

        {/* Demo Mode Toggle */}
        <div className="flex-center" style={{ gap: '8px' }}>
          <span className="form-label" style={{ margin: 0, fontSize: '13px' }}>Demo Traffic</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={isDemoModeActive}
              onChange={(e) => setIsDemoModeActive(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </header>
  );
};
