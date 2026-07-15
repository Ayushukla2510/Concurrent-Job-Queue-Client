import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../lib/apiClient';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Clock, 
  Play, 
  Cpu, 
  CheckCircle, 
  Plus, 
  Terminal, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { jobs, workers, events, backlogHistory, isOnline, triggerRefresh, addManualEvent } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobType, setJobType] = useState('LOG');
  const [payload, setPayload] = useState('{"message": "Manual test log from dashboard"}');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Job Injection States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkJobCount, setBulkJobCount] = useState(3);
  const [bulkJobsList, setBulkJobsList] = useState<Array<{ type: string; payload: string }>>([]);

  const getDefaultPayload = (type: string) => {
    if (type === 'LOG') return '{"message": "Bulk system log notification check"}';
    if (type === 'EMAIL') return '{"to": "bulk-recipients@services.com", "subject": "Bulk Sync Check", "body": "Automated payload check."}';
    if (type === 'PDF') return '{"documentId": "PDF-BULK", "title": "Bulk Compilation Report", "pages": 5}';
    if (type === 'IMAGE') return '{"source": "s3://bulk/processed.png", "resizeWidth": 256, "format": "png"}';
    if (type === 'SMS') return '{"phone": "+919999988888", "message": "Bulk SMS verification broadcast"}';
    return '{}';
  };

  const handleCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(20, count));
    setBulkJobCount(newCount);
    
    setBulkJobsList(prev => {
      const list = [...prev];
      if (list.length < newCount) {
        while (list.length < newCount) {
          list.push({ type: 'LOG', payload: getDefaultPayload('LOG') });
        }
      } else if (list.length > newCount) {
        list.splice(newCount);
      }
      return list;
    });
  };

  const handleRowTypeChange = (idx: number, type: string) => {
    setBulkJobsList(prev => {
      const list = [...prev];
      list[idx] = { type, payload: getDefaultPayload(type) };
      return list;
    });
  };

  const handleRowPayloadChange = (idx: number, val: string) => {
    setBulkJobsList(prev => {
      const list = [...prev];
      list[idx].payload = val;
      return list;
    });
  };

  const handleFillRandomMock = () => {
    const types = ['LOG', 'EMAIL', 'PDF', 'IMAGE', 'SMS'];
    const logs = [
      '{"message": "Log processed successfully"}',
      '{"message": "Gateway served request"}',
      '{"message": "Cache memory flushed"}'
    ];
    const emails = [
      '{"to": "user1@test.com", "subject": "Alert", "body": "Check system dashboard"}',
      '{"to": "audit@internal.net", "subject": "Daily report", "format": "html"}',
      '{"to": "dev-ops@company.org", "subject": "Auto-scaling active", "level": "info"}'
    ];
    const pdfs = [
      '{"reportId": 100, "pages": 4}',
      '{"invoiceId": "INV-102", "amount": 125.50}',
      '{"contractId": "CON-23", "status": "draft"}'
    ];
    const images = [
      '{"source": "s3://img1.jpg", "resize": true}',
      '{"source": "s3://banner.png", "compress": true}',
      '{"source": "s3://avatar.png", "format": "webp"}'
    ];
    const smsList = [
      '{"phone": "+1000", "message": "Verify login OTP: 1023"}',
      '{"phone": "+2000", "message": "Bulk notification alert"}',
      '{"phone": "+3000", "message": "Queue load exceeded limit"}'
    ];
    
    const getPayloadForType = (type: string) => {
      if (type === 'LOG') return logs[Math.floor(Math.random() * logs.length)];
      if (type === 'EMAIL') return emails[Math.floor(Math.random() * emails.length)];
      if (type === 'PDF') return pdfs[Math.floor(Math.random() * pdfs.length)];
      if (type === 'IMAGE') return images[Math.floor(Math.random() * images.length)];
      if (type === 'SMS') return smsList[Math.floor(Math.random() * smsList.length)];
      return '{}';
    };

    setBulkJobsList(Array.from({ length: bulkJobCount }, () => {
      const type = types[Math.floor(Math.random() * types.length)];
      return { type, payload: getPayloadForType(type) };
    }));
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < bulkJobsList.length; i++) {
      try {
        JSON.parse(bulkJobsList[i].payload);
      } catch (err) {
        alert(`Row ${i + 1}: Invalid JSON payload format.`);
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await apiClient.createJobsBulk(bulkJobsList);
      addManualEvent('job', `User manually bulk injected ${bulkJobsList.length} jobs simultaneously`, 'success');
      setIsBulkModalOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to submit bulk jobs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derive counts
  const pendingCount = jobs.filter(j => j.status === 'PENDING').length;
  const runningCount = jobs.filter(j => j.status === 'RUNNING').length;
  const activeWorkersCount = workers.filter(w => w.status === 'ACTIVE').length;
  const maxWorkers = 10; // Mirrored from PRD config defaults
  const completedCount = jobs.filter(j => j.status === 'COMPLETED').length;

  const handleTypeChange = (type: string) => {
    setJobType(type);
    if (type === 'LOG') {
      setPayload('{"message": "Manual test log from dashboard"}');
    } else if (type === 'EMAIL') {
      setPayload('{"to": "evaluator@gmail.com", "subject": "Test Notification", "body": "This is a custom payload message."}');
    } else if (type === 'PDF') {
      setPayload('{"documentId": "PDF-582", "title": "Dashboard Invoice Report", "pages": 3}');
    } else if (type === 'IMAGE') {
      setPayload('{"source": "s3://assets/banner.png", "resizeWidth": 512, "format": "webp"}');
    } else if (type === 'SMS') {
      setPayload('{"phone": "+919876543210", "message": "Manual verification trigger - OTP 7731"}');
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validate JSON payload
      try {
        JSON.parse(payload);
      } catch (err) {
        alert('Invalid JSON payload structure. Please fix JSON syntax.');
        setIsSubmitting(false);
        return;
      }

      await apiClient.createJob({ type: jobType, payload });
      addManualEvent('job', `User manually submitted a new ${jobType} job via Quick Action`, 'success');
      setIsModalOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to submit job:', err);
      alert('Failed to submit job. Make sure the backend is reachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Title Header */}
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>System Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time observability of queue execution, scaling, and worker status.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setIsBulkModalOpen(true);
              handleCountChange(3);
            }}
            disabled={!isOnline}
          >
            <Plus size={16} />
            <span>Bulk Submit Jobs</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={!isOnline}
          >
            <Plus size={16} />
            <span>Submit Test Job</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stat-grid">
        <div className="glass-card hoverable">
          <div className="flex-between" style={{ marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Backlog</span>
            <Clock size={20} color="var(--status-pending)" />
          </div>
          <div className="card-value">{pendingCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Waiting for worker claim</div>
        </div>

        <div className="glass-card hoverable">
          <div className="flex-between" style={{ marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Running Jobs</span>
            <Play size={20} color="var(--status-running)" />
          </div>
          <div className="card-value" style={{ color: 'var(--accent-blue)' }}>{runningCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Currently processing active tasks</div>
        </div>

        <div className="glass-card hoverable">
          <div className="flex-between" style={{ marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Active Workers</span>
            <Cpu size={20} color="var(--worker-active)" />
          </div>
          <div className="card-value">
            {activeWorkersCount} <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: 400 }}>/ {maxWorkers} Max</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Provisioned backend worker threads</div>
        </div>

        <div className="glass-card hoverable">
          <div className="flex-between" style={{ marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Total Completed</span>
            <CheckCircle size={20} color="var(--status-completed)" />
          </div>
          <div className="card-value" style={{ color: 'var(--status-completed)' }}>{completedCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Jobs processed successfully</div>
        </div>
      </div>

      {/* Worker Fleet Strip */}
      <div className="worker-strip-title">
        <span>Worker Fleet Active Nodes</span>
        <span>{workers.length} registered total</span>
      </div>
      <div className="worker-strip">
        {workers.length === 0 ? (
          <div className="glass-card" style={{ width: '100%', padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No active workers. Submit a job to trigger the auto-scaler!
          </div>
        ) : (
          workers.map((worker) => {
            const timeDiff = Math.max(0, Math.floor((Date.now() - new Date(worker.lastHeartbeat).getTime()) / 1000));
            const statusClass = worker.status.toLowerCase();
            return (
              <div key={worker.id} className={`worker-pill ${statusClass}`}>
                <span className="worker-pulse"></span>
                <span className="mono">{worker.hostname}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  ({worker.status === 'DEAD' ? 'Stale' : `${timeDiff}s ago`})
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Main Grid: Chart & Activity logs */}
      <div className="charts-grid">
        {/* Backlog Trend Chart */}
        <div className="glass-card">
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Backlog Trend (Real-time Polling)</h2>
          <div style={{ width: '100%', height: '350px' }}>
            {backlogHistory.length === 0 ? (
              <div className="flex-center flex-column" style={{ height: '100%', color: 'var(--text-secondary)' }}>
                <Sparkles size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                <span>Waiting for data points...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={backlogHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--status-pending)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--status-pending)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRunning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--status-running)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--status-running)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    stroke="var(--text-muted)" 
                    fontSize={11} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={11} 
                    tickLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0e1a', 
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-sans)',
                      color: '#fff'
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '13px' }} />
                  <Area 
                    name="Pending Backlog"
                    type="monotone" 
                    dataKey="pending" 
                    stroke="var(--status-pending)" 
                    fillOpacity={1} 
                    fill="url(#colorPending)" 
                  />
                  <Area 
                    name="Running Jobs"
                    type="monotone" 
                    dataKey="running" 
                    stroke="var(--status-running)" 
                    fillOpacity={1} 
                    fill="url(#colorRunning)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Compact Event Feed */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Recent Activities</h2>
            <Terminal size={16} color="var(--text-muted)" />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '350px' }}>
            {events.length === 0 ? (
              <div className="flex-center flex-column" style={{ height: '200px', color: 'var(--text-secondary)' }}>
                <span>No activities recorded yet.</span>
              </div>
            ) : (
              events.slice(0, 7).map((event) => (
                <div key={event.id} className="flex-column" style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  background: 'rgba(255,255,255,0.01)',
                  fontSize: '13px'
                }}>
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <span className={`badge ${event.category}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                      {event.category}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', wordBreak: 'break-word', fontFamily: 'var(--font-sans)' }}>
                    {event.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Submit Test Payload</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateJob}>
              <div className="form-group">
                <label className="form-label">Job Handler Type</label>
                <select 
                  className="form-select"
                  value={jobType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="LOG">LOG (Prints execution message)</option>
                  <option value="EMAIL">EMAIL (Simulates sending mail)</option>
                  <option value="PDF">PDF (Simulates compiling documents)</option>
                  <option value="IMAGE">IMAGE (Simulates image processing)</option>
                  <option value="SMS">SMS (Simulates texting alert OTPs)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Job Payload (JSON format)</label>
                <textarea 
                  className="form-textarea"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Injecting...' : 'Submit Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {isBulkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Bulk Inject Workloads</h3>
              <button className="modal-close" onClick={() => setIsBulkModalOpen(false)}>&times;</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              <div className="flex-between" style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Jobs Count (N):</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="20"
                    className="form-input" 
                    value={bulkJobCount}
                    onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
                    style={{ width: '80px', padding: '8px 12px' }}
                  />
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleFillRandomMock}
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  <Sparkles size={13} style={{ marginRight: '4px' }} />
                  <span>Fill Mock Data</span>
                </button>
              </div>

              <form onSubmit={handleBulkSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  {bulkJobsList.map((job, idx) => (
                    <div key={idx} style={{ 
                      padding: '16px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)', 
                      background: 'rgba(0,0,0,0.1)',
                      display: 'grid',
                      gridTemplateColumns: '150px 1fr',
                      gap: '12px',
                      alignItems: 'start'
                    }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Job #{idx + 1} Type</label>
                        <select 
                          className="form-select"
                          value={job.type}
                          onChange={(e) => handleRowTypeChange(idx, e.target.value)}
                          style={{ padding: '8px' }}
                        >
                          <option value="LOG">LOG</option>
                          <option value="EMAIL">EMAIL</option>
                          <option value="PDF">PDF</option>
                          <option value="IMAGE">IMAGE</option>
                          <option value="SMS">SMS</option>
                        </select>
                      </div>
                      
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Payload (JSON)</label>
                        <input 
                          type="text"
                          className="form-input mono"
                          value={job.payload}
                          onChange={(e) => handleRowPayloadChange(idx, e.target.value)}
                          required
                          style={{ padding: '8px 12px', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexShrink: 0 }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setIsBulkModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Injecting Bulk...' : `Inject ${bulkJobCount} Jobs`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
