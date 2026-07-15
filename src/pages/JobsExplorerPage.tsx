import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { Search, RefreshCw, RefreshCcw, Eye, Play, CheckCircle, AlertTriangle, Skull } from 'lucide-react';
import { Job } from '../lib/types';

export const JobsExplorerPage: React.FC = () => {
  const { jobs, isOnline, triggerRefresh, addManualEvent } = useApp();
  const navigate = useNavigate();
  
  // Filter states
  const [searchId, setSearchId] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [revivingId, setRevivingId] = useState<number | null>(null);

  // Live countdown states for running leases
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesId = searchId === '' || job.id.toString().includes(searchId);
    const matchesStatus = filterStatus === 'ALL' || job.status === filterStatus;
    const matchesType = filterType === 'ALL' || job.type === filterType;
    return matchesId && matchesStatus && matchesType;
  });

  // Unique job types in the system
  const jobTypes = ['ALL', ...Array.from(new Set(jobs.map((j) => j.type)))];

  const handleRevive = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation(); // Prevent row click navigation
    setRevivingId(job.id);
    try {
      await apiClient.reviveJob(job.id, job.type, job.payload);
      addManualEvent('job', `Job #${job.id} revived manually. Status reset to PENDING with attempts = 0.`, 'success');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to revive job:', err);
      alert('Failed to revive job.');
    } finally {
      setRevivingId(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge pending">Pending</span>;
      case 'RUNNING':
        return <span className="badge running">Running</span>;
      case 'COMPLETED':
        return <span className="badge completed">Completed</span>;
      case 'FAILED':
        return <span className="badge failed">Failed</span>;
      case 'DEAD':
        return <span className="badge dead">Dead</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getLeaseCountdown = (leaseExpiresAt: string | null) => {
    if (!leaseExpiresAt) return '-';
    const expiresTime = new Date(leaseExpiresAt).getTime();
    const diff = Math.ceil((expiresTime - now) / 1000);
    
    if (diff <= 0) return <span style={{ color: 'var(--status-dead)', fontWeight: 500 }}>Expired</span>;
    return <span style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>{diff}s</span>;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="page-container">
      {/* Title Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Jobs Explorer</h1>
        <p style={{ color: 'var(--text-secondary)' }}>View, inspect, and manage individual job payloads and leases in the queue.</p>
      </div>

      {/* Filter Options Bar */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Search Job ID</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Filter by Status</label>
            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="PENDING">PENDING</option>
              <option value="RUNNING">RUNNING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
              <option value="DEAD">DEAD</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Filter by Type</label>
            <select 
              className="form-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'ALL' ? 'ALL TYPES' : type}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setSearchId('');
                setFilterStatus('ALL');
                setFilterType('ALL');
              }}
              style={{ flex: 1 }}
            >
              Reset Filters
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={triggerRefresh}
              title="Refresh jobs"
              style={{ width: '44px', padding: 0 }}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredJobs.length === 0 ? (
          <div className="flex-center flex-column" style={{ padding: '60px', color: 'var(--text-secondary)' }}>
            <Search size={32} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: '#fff' }}>No Jobs Found</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No records match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Assigned Worker</th>
                  <th>Created At</th>
                  <th>Run After</th>
                  <th>Lease Countdown</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className="clickable"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <td className="mono" style={{ fontWeight: 600 }}>#{job.id}</td>
                    <td>
                      <span className="mono" style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {job.type}
                      </span>
                    </td>
                    <td>{renderStatusBadge(job.status)}</td>
                    <td className="mono">
                      <span style={{ color: job.attempts >= job.maxAttempts ? 'var(--status-dead)' : 'var(--text-primary)' }}>
                        {job.attempts}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}> / {job.maxAttempts}</span>
                    </td>
                    <td>
                      {job.worker ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="status-dot online" style={{ width: '6px', height: '6px' }}></span>
                          <span className="mono" style={{ fontSize: '13px' }}>{job.worker.hostname}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {formatDateTime(job.createdAt)}
                    </td>
                    <td className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {formatDateTime(job.runAfter)}
                    </td>
                    <td className="mono">
                      {job.status === 'RUNNING' ? getLeaseCountdown(job.leaseExpiresAt) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="View Details"
                        >
                          <Eye size={12} />
                        </button>
                        
                        {(job.status === 'FAILED' || job.status === 'DEAD') && (
                          <button 
                            className="btn btn-primary" 
                            onClick={(e) => handleRevive(e, job)}
                            disabled={!isOnline || revivingId === job.id}
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Revive Job"
                          >
                            <RefreshCcw size={12} className={revivingId === job.id ? 'spin' : ''} />
                            <span>{revivingId === job.id ? 'Reviving...' : 'Revive'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
