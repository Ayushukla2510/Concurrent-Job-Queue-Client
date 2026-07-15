import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, Trash2, Pause, Play, Filter } from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const { events, clearEvents } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Filtered event log
  const filteredEvents = events.filter(evt => {
    if (filterCategory === 'ALL') return true;
    return evt.category.toUpperCase() === filterCategory;
  });

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (isAutoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredEvents, isAutoScroll]);

  const getLogColorClass = (category: string) => {
    return `log-category ${category.toLowerCase()}`;
  };

  return (
    <div className="page-container">
      {/* Title Header */}
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Activity Log Terminal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitored event logs and lifecycle transitions derived from state polling.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isAutoScroll ? <Pause size={14} /> : <Play size={14} />}
            <span>{isAutoScroll ? 'Auto-Scroll On' : 'Auto-Scroll Off'}</span>
          </button>
          <button 
            className="btn btn-danger"
            onClick={clearEvents}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={14} />
            <span>Clear Terminal</span>
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
          <Filter size={16} />
          <span>Category Filter:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'SYSTEM', 'JOB', 'WORKER', 'SCALING', 'RECOVERY'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: filterCategory === cat ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.01)',
                borderColor: filterCategory === cat ? 'var(--accent-blue)' : 'var(--border-color)',
                color: filterCategory === cat ? '#fff' : 'var(--text-secondary)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal View */}
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot red"></span>
            <span className="terminal-dot yellow"></span>
            <span className="terminal-dot green"></span>
          </div>
          <div className="terminal-title">system_event_stream.log</div>
          <Terminal size={14} color="var(--text-muted)" />
        </div>
        
        <div className="terminal-body">
          {filteredEvents.length === 0 ? (
            <div className="flex-center flex-column" style={{ height: '100%', color: 'var(--text-muted)' }}>
              <span>No logs matching selected category filter.</span>
            </div>
          ) : (
            filteredEvents.slice().reverse().map((event) => (
              <div className="log-row" key={event.id}>
                <span className="log-time">
                  [{event.timestamp.toLocaleTimeString()}]
                </span>
                <span className={getLogColorClass(event.category)}>
                  {event.category.toUpperCase()}
                </span>
                <span className="log-msg">
                  {event.message}
                </span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
