import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../lib/apiClient';
import { Cpu, Plus, RefreshCw, Zap, Clock, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WorkersExplorerPage: React.FC = () => {
  const { workers, jobs, isOnline, triggerRefresh, addManualEvent } = useApp();
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);

  // Live timer for heartbeats
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRegisterWorker = async () => {
    setRegistering(true);
    try {
      const rand = Math.floor(100 + Math.random() * 900);
      const hostname = `manual-worker-${rand}`;
      const newWorker = await apiClient.registerWorker(hostname);
      addManualEvent('worker', `Worker registered successfully: ${newWorker.hostname} (ID: ${newWorker.id})`, 'success');
      triggerRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to register worker');
    } finally {
      setRegistering(false);
    }
  };

  const getRelativeTime = (timeStr: string) => {
    const time = new Date(timeStr).getTime();
    const diff = Math.max(0, Math.floor((now - time) / 1000));
    if (diff < 5) return 'Just now';
    return `${diff}s ago`;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge completed" style={{ fontSize: '11px', padding: '2px 8px' }}>Active</span>;
      case 'DRAINING':
        return <span className="badge failed" style={{ fontSize: '11px', padding: '2px 8px' }}>Draining</span>;
      case 'DEAD':
        return <span className="badge dead" style={{ fontSize: '11px', padding: '2px 8px' }}>Dead</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Title Header */}
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Workers Fleet</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Observe worker container nodes, thread pooling registration, and heartbeat lifecycles.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={triggerRefresh}
            style={{ width: '44px', padding: 0 }}
          >
            <RefreshCw size={16} />
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleRegisterWorker}
            disabled={!isOnline || registering}
          >
            <Plus size={16} />
            <span>{registering ? 'Spawning...' : 'Register Worker'}</span>
          </button>
        </div>
      </div>

      {/* Grid of workers */}
      {workers.length === 0 ? (
        <div className="glass-card flex-center flex-column" style={{ padding: '80px', color: 'var(--text-secondary)' }}>
          <Cpu size={48} color="var(--text-muted)" style={{ marginBottom: '20px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>No Workers Online</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
            There are currently no background workers registered in the fleet. Workers are spawned automatically when backlog queues fill up.
          </p>
          <button 
            className="btn btn-primary"
            onClick={handleRegisterWorker}
            disabled={!isOnline || registering}
          >
            Spawn A Worker Manually
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {workers.map((worker) => {
            // Find current job running on this worker
            const runningJob = jobs.find(
              (j) => j.status === 'RUNNING' && j.worker?.id === worker.id
            );

            // Compute health status based on heartbeat timestamp
            const heartbeatTime = new Date(worker.lastHeartbeat).getTime();
            const timeDiff = Math.max(0, Math.floor((now - heartbeatTime) / 1000));
            const isStale = timeDiff > 60; // Config threshold in PRD is 60s
            
            const isDead = worker.status === 'DEAD' || isStale;

            return (
              <div 
                key={worker.id} 
                className={`glass-card hoverable flex-column`}
                style={{ 
                  gap: '16px',
                  borderColor: isDead ? 'rgba(239, 68, 68, 0.15)' : 'var(--border-color)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Visual indicator of worker */}
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  height: '3px', 
                  width: '100%', 
                  background: isDead 
                    ? 'var(--status-dead)' 
                    : worker.status === 'DRAINING' 
                      ? 'var(--status-failed)' 
                      : 'var(--status-completed)' 
                }}></div>

                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Cpu size={18} color={isDead ? 'var(--text-muted)' : 'var(--accent-blue)'} />
                    <span className="mono" style={{ fontWeight: 600, fontSize: '15px' }}>{worker.hostname}</span>
                  </div>
                  {renderStatusBadge(isDead ? 'DEAD' : worker.status)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-secondary)' }}>ID</span>
                    <span className="mono">#{worker.id}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Last Heartbeat</span>
                    <span className="mono" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} color="var(--text-muted)" />
                      {getRelativeTime(worker.lastHeartbeat)}
                    </span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Assigned Job</span>
                    {runningJob ? (
                      <span 
                        onClick={() => navigate(`/jobs/${runningJob.id}`)}
                        className="mono" 
                        style={{ 
                          color: 'var(--accent-blue)', 
                          cursor: 'pointer', 
                          fontWeight: 500,
                          textDecoration: 'underline'
                        }}
                      >
                        Job #{runningJob.id}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Idle</span>
                    )}
                  </div>
                </div>

                {isDead && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 12px', 
                    background: 'rgba(239, 68, 68, 0.05)', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.1)'
                  }}>
                    <ShieldAlert size={14} />
                    <span>Heartbeat stale. Rescheduling assigned jobs.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
