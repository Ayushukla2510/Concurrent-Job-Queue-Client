import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiClient } from '../lib/apiClient';
import { Worker, Job } from '../lib/types';
import { 
  ArrowLeft, 
  Cpu, 
  Clock, 
  Activity, 
  ShieldAlert, 
  Heart, 
  CheckCircle2, 
  Play, 
  ListTodo
} from 'lucide-react';

export const WorkerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workers, jobs, isOnline, triggerRefresh, addManualEvent } = useApp();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [heartbeatLogs, setHeartbeatLogs] = useState<string[]>([]);
  const [pinging, setPinging] = useState(false);

  // Sync worker data
  useEffect(() => {
    if (!id) return;
    const workerIdStr = id;
    const foundWorker = workers.find(w => w.id.toString() === workerIdStr);
    
    if (foundWorker) {
      setWorker(foundWorker);
      setIsLoading(false);
    } else {
      const fetchWorker = async () => {
        try {
          const data = await apiClient.getWorker(parseInt(workerIdStr));
          setWorker(data);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchWorker();
    }
  }, [id, workers]);

  // Mock initial heartbeat history logs based on last check-in
  useEffect(() => {
    if (!worker) return;
    const logs: string[] = [];
    const baseTime = new Date(worker.lastHeartbeat).getTime();
    for (let i = 0; i < 5; i++) {
      const date = new Date(baseTime - i * 30000); // 30s intervals
      logs.push(`${date.toLocaleTimeString()} - Heartbeat check-in OK (status: ACTIVE)`);
    }
    setHeartbeatLogs(logs);
  }, [worker?.id]);

  if (isLoading) {
    return (
      <div className="page-container flex-center flex-column" style={{ height: '300px' }}>
        <div className="spin" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}></div>
        <span style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading worker details...</span>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="page-container">
        <button className="btn btn-secondary" onClick={() => navigate('/workers')} style={{ marginBottom: '24px' }}>
          <ArrowLeft size={16} />
          <span>Back to Workers Fleet</span>
        </button>
        <div className="glass-card flex-center flex-column" style={{ padding: '60px', color: 'var(--text-secondary)' }}>
          <ShieldAlert size={32} color="var(--status-dead)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Worker Not Found</h3>
          <p>The requested Worker ID #{id} does not exist in the active rotation.</p>
        </div>
      </div>
    );
  }

  const handleSendHeartbeat = async () => {
    setPinging(true);
    try {
      await apiClient.sendHeartbeat(worker.id);
      addManualEvent('worker', `Manual Heartbeat: Worker '${worker.hostname}' sent ping to backend`, 'info');
      // Add a line to the local log list
      const timeStr = new Date().toLocaleTimeString();
      setHeartbeatLogs(prev => [`${timeStr} - Manual Heartbeat ping sent (OK)`, ...prev]);
      triggerRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to send heartbeat');
    } finally {
      setPinging(false);
    }
  };

  // Find jobs currently running on this worker
  const activeJobs = jobs.filter(j => j.status === 'RUNNING' && j.worker?.id === worker.id);
  
  // Find completed/other jobs assigned to this worker in cache
  const historicalJobs = jobs.filter(j => j.worker?.id === worker.id && j.status !== 'RUNNING');

  return (
    <div className="page-container">
      {/* Back button */}
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/workers')} 
        style={{ marginBottom: '24px' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Workers Fleet</span>
      </button>

      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>{worker.hostname}</span>
              <span className={`badge ${worker.status === 'ACTIVE' ? 'completed' : worker.status === 'DRAINING' ? 'failed' : 'dead'}`}>
                {worker.status}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Worker Node ID: <strong className="mono">#{worker.id}</strong> | Registered: {new Date(worker.createdAt).toLocaleString()}
            </p>
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleSendHeartbeat}
            disabled={!isOnline || pinging || worker.status === 'DEAD'}
          >
            <Heart size={14} fill={worker.status === 'ACTIVE' ? '#fff' : 'none'} style={{ marginRight: '6px' }} />
            <span>{pinging ? 'Sending...' : 'Send Heartbeat Ping'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Heartbeat history + Jobs running */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Heartbeat history */}
        <div className="glass-card flex-column">
          <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--accent-blue)" />
              <span>Heartbeat Logs (30s frequency)</span>
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latest checks first</span>
          </div>

          <div className="mono" style={{ 
            background: '#020408', 
            padding: '16px', 
            borderRadius: '8px', 
            border: '1px solid var(--border-color)',
            fontSize: '12px', 
            color: 'var(--text-secondary)',
            height: '300px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {heartbeatLogs.map((log, index) => (
              <div key={index} style={{ paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Assigned tasks */}
        <div className="glass-card flex-column">
          <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListTodo size={18} color="var(--accent-purple)" />
              <span>Assigned Workloads</span>
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active & Historical</span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '300px' }}>
            {activeJobs.length === 0 && historicalJobs.length === 0 ? (
              <div className="flex-center flex-column" style={{ height: '200px', color: 'var(--text-secondary)' }}>
                <span>No jobs assigned to this worker node.</span>
              </div>
            ) : (
              <>
                {/* Active Jobs */}
                {activeJobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    style={{ 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--status-running)', 
                      background: 'rgba(59, 130, 246, 0.03)',
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Play size={14} color="var(--status-running)" />
                      <span className="mono" style={{ fontWeight: 600 }}>Job #{job.id} ({job.type})</span>
                    </div>
                    <span className="badge running" style={{ fontSize: '10px' }}>Running</span>
                  </div>
                ))}

                {/* Historical Jobs */}
                {historicalJobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    style={{ 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)', 
                      background: 'rgba(255,255,255,0.01)',
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={14} color={job.status === 'COMPLETED' ? 'var(--status-completed)' : 'var(--status-dead)'} />
                      <span className="mono" style={{ fontWeight: 600 }}>Job #{job.id} ({job.type})</span>
                    </div>
                    <span className={`badge ${job.status.toLowerCase()}`} style={{ fontSize: '10px' }}>{job.status}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
