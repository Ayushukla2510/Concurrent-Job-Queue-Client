import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiClient } from '../lib/apiClient';
import { Job } from '../lib/types';
import { 
  ArrowLeft, 
  Clock, 
  Cpu, 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCcw, 
  Play,
  FileText
} from 'lucide-react';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOnline, triggerRefresh, addManualEvent, jobs } = useApp();
  
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRawExpanded, setIsRawExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Live countdown timer state
  const [now, setNow] = useState(Date.now());

  // Find job from the global list, or fetch it specifically
  useEffect(() => {
    if (!id) return;
    const jobIdStr = id;
    const foundJob = jobs.find(j => j.id.toString() === jobIdStr);
    
    if (foundJob) {
      setJob(foundJob);
      setIsLoading(false);
    } else {
      // Fetch specifically if not found in cache
      const fetchJob = async () => {
        try {
          const data = await apiClient.getJob(parseInt(jobIdStr));
          setJob(data);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchJob();
    }
  }, [id, jobs]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="page-container flex-center flex-column" style={{ height: '300px' }}>
        <div className="spin" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}></div>
        <span style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading job details...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-container">
        <button className="btn btn-secondary" onClick={() => navigate('/jobs')} style={{ marginBottom: '24px' }}>
          <ArrowLeft size={16} />
          <span>Back to Jobs Explorer</span>
        </button>
        <div className="glass-card flex-center flex-column" style={{ padding: '60px', color: 'var(--text-secondary)' }}>
          <AlertTriangle size={32} color="var(--status-dead)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Job Not Found</h3>
          <p>The requested Job ID #{id} does not exist in the database.</p>
        </div>
      </div>
    );
  }

  // Action Handlers
  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await apiClient.completeJob(job.id);
      addManualEvent('job', `Manual Override: Job #${job.id} marked as COMPLETED by user`, 'success');
      triggerRefresh();
    } catch (err) {
      alert('Failed to complete job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFail = async () => {
    setActionLoading(true);
    try {
      await apiClient.failJob(job.id);
      addManualEvent('job', `Manual Override: Job #${job.id} marked as FAILED by user`, 'warning');
      triggerRefresh();
    } catch (err) {
      alert('Failed to fail job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevive = async () => {
    setActionLoading(true);
    try {
      await apiClient.reviveJob(job.id, job.type, job.payload);
      addManualEvent('job', `Manual Override: Job #${job.id} revived back to PENDING`, 'success');
      triggerRefresh();
    } catch (err) {
      alert('Failed to revive job');
    } finally {
      setActionLoading(false);
    }
  };

  // Reconstruct lifecycle timeline events based on job status & attempts
  const buildTimelineEvents = () => {
    const events: Array<{ title: string; desc: string; time: string; status: 'active' | 'success' | 'failed' | 'dead' | 'pending' }> = [];
    
    // 1. Creation
    events.push({
      title: 'Job Created',
      desc: `Submitted payload for handler [${job.type}]`,
      time: new Date(job.createdAt).toLocaleString(),
      status: 'success'
    });

    // 2. Previous attempt recoveries (if any)
    if (job.attempts > 0) {
      for (let i = 1; i <= job.attempts; i++) {
        // If it failed/running repeatedly, simulate intermediate recovery checks
        const timeOffset = new Date(new Date(job.createdAt).getTime() + i * 45000).toLocaleString();
        events.push({
          title: `Lease Timeout / Failure (Attempt ${i})`,
          desc: `Worker failed to complete task within timeout period. Rescheduling...`,
          time: timeOffset,
          status: 'failed'
        });
      }
    }

    // 3. Current state transitions
    if (job.status === 'RUNNING') {
      events.push({
        title: 'Job Claimed & Running',
        desc: `Acquired row-level lock (SKIP LOCKED) by worker node '${job.worker?.hostname || 'Unknown'}'`,
        time: new Date(job.updatedAt).toLocaleString(),
        status: 'active'
      });
    } else if (job.status === 'COMPLETED') {
      events.push({
        title: 'Job Claimed & Running',
        desc: `Acquired row-level lock (SKIP LOCKED) by worker`,
        time: new Date(new Date(job.updatedAt).getTime() - 2000).toLocaleString(),
        status: 'success'
      });
      events.push({
        title: 'Execution Succeeded',
        desc: `Completed successfully. Worker released job lease.`,
        time: new Date(job.updatedAt).toLocaleString(),
        status: 'success'
      });
    } else if (job.status === 'FAILED') {
      events.push({
        title: 'Execution Failed',
        desc: `Job attempts (${job.attempts}) reached limits. Marked as FAILED.`,
        time: new Date(job.updatedAt).toLocaleString(),
        status: 'failed'
      });
    } else if (job.status === 'DEAD') {
      events.push({
        title: 'Recovery Failure (DEAD)',
        desc: `RecoveryScheduler flagged worker node as disconnected. Job recovery limit exceeded. Marked DEAD.`,
        time: new Date(job.updatedAt).toLocaleString(),
        status: 'dead'
      });
    } else {
      // PENDING
      events.push({
        title: 'Pending In Queue',
        desc: 'Waiting for available worker nodes to poll and claim.',
        time: new Date(job.updatedAt).toLocaleString(),
        status: 'pending'
      });
    }

    return events;
  };

  const getLeaseCountdown = () => {
    if (!job.leaseExpiresAt) return null;
    const expiresTime = new Date(job.leaseExpiresAt).getTime();
    const diff = Math.ceil((expiresTime - now) / 1000);
    if (diff <= 0) return <span style={{ color: 'var(--status-dead)' }}>Expired (Stale lease)</span>;
    return <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{diff}s remaining</span>;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge pending">Pending</span>;
      case 'RUNNING': return <span className="badge running">Running</span>;
      case 'COMPLETED': return <span className="badge completed">Completed</span>;
      case 'FAILED': return <span className="badge failed">Failed</span>;
      case 'DEAD': return <span className="badge dead">Dead</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  // Pretty print JSON payload
  let prettyPayload = job.payload;
  try {
    prettyPayload = JSON.stringify(JSON.parse(job.payload), null, 2);
  } catch (err) {
    // Leave as raw string if it's not valid JSON
  }

  return (
    <div className="page-container">
      {/* Back navigation */}
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/jobs')} 
        style={{ marginBottom: '24px' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Jobs Explorer</span>
      </button>

      {/* Header card */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>Job #{job.id}</span>
              {renderStatusBadge(job.status)}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Type: <strong className="mono">{job.type}</strong> | Created: {new Date(job.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Action triggers */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {job.status === 'RUNNING' && (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleComplete}
                  disabled={!isOnline || actionLoading}
                >
                  <CheckCircle size={14} color="var(--status-completed)" />
                  <span>Manual Complete</span>
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleFail}
                  disabled={!isOnline || actionLoading}
                >
                  <AlertTriangle size={14} />
                  <span>Manual Fail</span>
                </button>
              </>
            )}

            {(job.status === 'FAILED' || job.status === 'DEAD' || job.status === 'COMPLETED') && (
              <button 
                className="btn btn-primary" 
                onClick={handleRevive}
                disabled={!isOnline || actionLoading}
              >
                <RefreshCcw size={14} />
                <span>Revive / Re-run Job</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* General details */}
        <div className="glass-card flex-column" style={{ gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            Lease & Execution Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Attempt</div>
              <div className="mono" style={{ fontSize: '16px', fontWeight: 600 }}>{job.attempts} / {job.maxAttempts} Max</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Lease Timer</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {job.status === 'RUNNING' ? getLeaseCountdown() : '-'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Assigned Worker</div>
              <div className="mono" style={{ fontSize: '16px', fontWeight: 600 }}>
                {job.worker ? job.worker.hostname : 'Unassigned'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Slated For Execution</div>
              <div className="mono" style={{ fontSize: '14px', fontWeight: 600 }}>
                {job.runAfter ? new Date(job.runAfter).toLocaleTimeString() : 'Immediate'}
              </div>
            </div>
          </div>
        </div>

        {/* Payload Viewer */}
        <div className="glass-card flex-column">
          <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
            Payload Viewer
          </h3>
          <pre className="mono" style={{ 
            background: '#040711', 
            padding: '16px', 
            borderRadius: '8px', 
            border: '1px solid var(--border-color)',
            fontSize: '13px', 
            color: 'var(--accent-blue)',
            overflow: 'auto',
            flex: 1
          }}>
            {prettyPayload}
          </pre>
        </div>
      </div>

      {/* Lifecycle timeline */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
          Lifecycle Timeline
        </h3>
        <div className="timeline">
          {buildTimelineEvents().map((evt, idx) => (
            <div className="timeline-item" key={idx}>
              <span className={`timeline-marker ${evt.status}`}></span>
              <div className="timeline-content">
                <span className="timeline-title">{evt.title}</span>
                <span className="timeline-desc">{evt.desc}</span>
                <span className="timeline-time">{evt.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw API Response */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div 
          onClick={() => setIsRawExpanded(!isRawExpanded)}
          style={{ 
            padding: '16px 24px', 
            background: 'rgba(255,255,255,0.01)', 
            borderBottom: isRawExpanded ? '1px solid var(--border-color)' : 'none',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Raw API Response (GET /jobs/{job.id})</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isRawExpanded ? 'Collapse' : 'Expand'}
          </span>
        </div>
        {isRawExpanded && (
          <pre className="mono" style={{ 
            padding: '24px', 
            fontSize: '12px', 
            background: '#020408', 
            overflow: 'auto',
            color: 'var(--text-secondary)'
          }}>
            {JSON.stringify(job, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
