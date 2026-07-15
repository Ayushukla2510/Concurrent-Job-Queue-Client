import React, { useState } from 'react';
import { Layers, Cpu, Database, Flame, Clock, Sliders, ShieldAlert } from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  // Auto-Scaling slider state
  const [pendingJobsCount, setPendingJobsCount] = useState(15);
  
  // Scaling Constants
  const MAX_WORKERS = 10;
  const JOBS_PER_WORKER = 5;

  // Calculate scaling output
  const calculateDesiredWorkers = (jobs: number) => {
    if (jobs === 0) return 0; // if no jobs, technically desired starts at 1 if active worker remains, but let's mirror formula
    return Math.min(MAX_WORKERS, Math.floor(jobs / JOBS_PER_WORKER) + 1);
  };

  const desiredWorkers = calculateDesiredWorkers(pendingJobsCount);

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>System Architecture</h1>
        <p style={{ color: 'var(--text-secondary)' }}>An in-depth guide to atomic claiming, dynamic scaling, heartbeat loops, and self-healing mechanisms.</p>
      </div>

      {/* 1. Job lifecycle and state machine */}
      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} color="var(--accent-purple)" />
          <span>Job Lifecycle State Machine</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
          Jobs progress through deterministic stages to guarantee at-least-once execution. Stalled running jobs are recovered via lease timers.
        </p>

        {/* State machine flex flow */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px',
          padding: '24px',
          background: 'rgba(255,255,255,0.01)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div className="flex-column flex-center" style={{ gap: '8px' }}>
            <span className="badge pending" style={{ padding: '8px 16px' }}>PENDING</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ready for processing</span>
          </div>

          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>➔</span>

          <div className="flex-column flex-center" style={{ gap: '8px' }}>
            <span className="badge running" style={{ padding: '8px 16px' }}>RUNNING</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Worker locked row</span>
          </div>

          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>➔</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge completed" style={{ padding: '6px 12px', width: '100px', textAlign: 'center' }}>Completed</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Execution success</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge failed" style={{ padding: '6px 12px', width: '100px', textAlign: 'center' }}>Failed</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Retry limit &lt; max</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge dead" style={{ padding: '6px 12px', width: '100px', textAlign: 'center' }}>Dead</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stale heartbeats</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Auto-Scaling Calculator */}
      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={20} color="var(--accent-blue)" />
          <span>Interactive Auto-Scaling Calculator</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
          The backend runs a `ScalingScheduler` every **15 seconds** that evaluates the size of the pending queue backlog and scales worker thread pools up or down based on load.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
          {/* Slider input */}
          <div className="flex-column" style={{ gap: '16px' }}>
            <div className="flex-between">
              <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-secondary)' }}>Pending Jobs Backlog</span>
              <span className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-blue)' }}>{pendingJobsCount} jobs</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="50" 
              value={pendingJobsCount}
              onChange={(e) => setPendingJobsCount(parseInt(e.target.value))}
              style={{ 
                width: '100%',
                accentColor: 'var(--accent-blue)',
                cursor: 'pointer'
              }}
            />
            <div className="mono" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border-color)' }}>
              Formula: Math.min(MAX_WORKERS, (pendingJobs / JOBS_PER_WORKER) + 1)<br/>
              ↳ Math.min({MAX_WORKERS}, ({pendingJobsCount} / {JOBS_PER_WORKER}) + 1) = <strong>{desiredWorkers}</strong> desired workers.
            </div>
          </div>

          {/* Visual Thread Pool Grid */}
          <div className="flex-column" style={{ gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Visualised Thread Pool (Max 10)</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              {Array.from({ length: MAX_WORKERS }).map((_, idx) => {
                const isActive = idx < desiredWorkers;
                return (
                  <div 
                    key={idx}
                    className="flex-center flex-column"
                    style={{ 
                      padding: '12px 8px', 
                      borderRadius: '8px', 
                      background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                      opacity: isActive ? 1 : 0.3,
                      transition: 'all 0.2s ease',
                      fontSize: '11px'
                    }}
                  >
                    <Cpu size={16} color={isActive ? 'var(--status-completed)' : 'var(--text-muted)'} style={{ marginBottom: '4px' }} />
                    <span className="mono" style={{ fontSize: '9px' }}>T-{idx+1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Atomic Claiming section */}
      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--status-completed)" />
          <span>Atomic Job Claiming (Race Condition Prevention)</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
          When multiple worker threads attempt to pull jobs from the same PostgreSQL database simultaneously, they must not double-claim the same job. The engine implements row-level locking via:
        </p>

        <pre className="mono" style={{ 
          background: '#040711', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid var(--border-color)',
          fontSize: '13px', 
          color: 'var(--accent-blue)',
          overflow: 'auto',
          marginBottom: '20px'
        }}>
{`SELECT * FROM jobs
WHERE status = 'PENDING' AND run_after <= :now
ORDER BY run_after ASC
LIMIT 1
FOR UPDATE SKIP LOCKED`}
        </pre>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', fontSize: '13px', lineHeight: 1.5 }}>
          <div className="flex-column" style={{ gap: '10px' }}>
            <strong style={{ color: '#fff' }}>FOR UPDATE</strong>
            <span style={{ color: 'var(--text-secondary)' }}>
              Locks the target row so no other database transaction can modify or lock it until the current transaction completes.
            </span>
          </div>
          <div className="flex-column" style={{ gap: '10px' }}>
            <strong style={{ color: '#fff' }}>SKIP LOCKED</strong>
            <span style={{ color: 'var(--text-secondary)' }}>
              Instructs concurrent workers to skip locked rows and jump to the next un-locked pending row, avoiding thread wait bottlenecks and blocking queries.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Heartbeats & Recovery sweeps */}
      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="var(--status-failed)" />
          <span>Heartbeats, Leases, and Crash Recovery</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
          Workers and job leases maintain active checkpoints. Stale heartbeats automatically trigger recovery sweeps:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600, color: '#fff' }}>
              <Flame size={14} color="var(--status-completed)" />
              <span>Worker Heartbeat (30s)</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Active workers run a separate scheduler that updates their `last_heartbeat` timestamp in the database every 30 seconds.
            </p>
          </div>

          <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600, color: '#fff' }}>
              <Clock size={14} color="var(--status-running)" />
              <span>Job Lease (60s * attempts)</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Claimed jobs get a lease timeout. If the worker processing it crashes mid-execution, the lease expires and another worker resets the job status.
            </p>
          </div>

          <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600, color: '#fff' }}>
              <ShieldAlert size={14} color="var(--status-dead)" />
              <span>Recovery Sweep (30s)</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              `RecoveryScheduler` scans the tables. If a worker hasn't updated its heartbeat in &gt; 60 seconds, it's flagged as `DEAD`, and its running jobs are revived.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
