import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Job, Worker, SystemEvent, JobStatus, HistoryPoint } from '../lib/types';
import { apiClient } from '../lib/apiClient';

interface AppContextType {
  jobs: Job[];
  workers: Worker[];
  events: SystemEvent[];
  backlogHistory: HistoryPoint[];
  isOnline: boolean;
  isPollingActive: boolean;
  setIsPollingActive: (val: boolean) => void;
  isDemoModeActive: boolean;
  setIsDemoModeActive: (val: boolean) => void;
  triggerRefresh: () => Promise<void>;
  addManualEvent: (category: 'job' | 'worker' | 'system' | 'scaling' | 'recovery', message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  clearEvents: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const JOB_TYPES = ['LOG', 'EMAIL', 'PDF', 'IMAGE', 'SMS'];
const MOCK_PAYLOADS: Record<string, string[]> = {
  LOG: [
    '{"message": "User login attempt successful", "userId": 492}',
    '{"message": "API gateway request served in 42ms", "route": "/jobs"}',
    '{"message": "Database connection pool usage: 4/10", "pool": "HikariPool-1"}'
  ],
  EMAIL: [
    '{"to": "evaluator@company.com", "subject": "Evaluation Update", "template": "hr_notify"}',
    '{"to": "system-admin@internal.net", "subject": "Alert: Database latency high", "severity": "CRITICAL"}',
    '{"to": "new_hire@talent.org", "subject": "Welcome Package Dispatch", "tracking_id": "EP-98421"}'
  ],
  PDF: [
    '{"reportId": 8940, "title": "Quarterly Financial Analysis", "pages": 12}',
    '{"invoiceId": "INV-2026-079", "customer": "Stark Industries", "amount": 89500}',
    '{"documentId": "DOC-XYZ", "type": "EmployeeOnboardingContract", "signee": "Jane Doe"}'
  ],
  IMAGE: [
    '{"source": "s3://uploads/avatar_491.jpg", "resizeWidth": 256, "format": "webp"}',
    '{"source": "s3://assets/hero_banner.png", "compress": true, "quality": 85}',
    '{"source": "s3://products/img_903.png", "thumbnail": true, "watermark": "CONFIDENTIAL"}'
  ],
  SMS: [
    '{"phone": "+15550199", "message": "Your one-time verification code is 892401"}',
    '{"phone": "+44791112", "message": "Alert: Unusual worker scale-up detected on host-node-3"}',
    '{"phone": "+91987654", "message": "Job #491 completed successfully on worker-01"}'
  ]
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [backlogHistory, setBacklogHistory] = useState<HistoryPoint[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);
  const [isDemoModeActive, setIsDemoModeActive] = useState<boolean>(false);

  const prevJobsRef = useRef<Job[]>([]);
  const prevWorkersRef = useRef<Worker[]>([]);
  const eventIdRef = useRef<number>(1);

  const addEvent = (
    category: 'job' | 'worker' | 'system' | 'scaling' | 'recovery',
    message: string,
    type: 'info' | 'success' | 'warning' | 'error'
  ) => {
    const newEvent: SystemEvent = {
      id: `evt-${Date.now()}-${eventIdRef.current++}`,
      timestamp: new Date(),
      category,
      message,
      type
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 200)); // Cap logs at 200 items
  };

  const addManualEvent = (
    category: 'job' | 'worker' | 'system' | 'scaling' | 'recovery',
    message: string,
    type: 'info' | 'success' | 'warning' | 'error'
  ) => {
    addEvent(category, message, type);
  };

  const clearEvents = () => {
    setEvents([]);
    addEvent('system', 'Terminal logs cleared.', 'info');
  };

  // Sync / Fetch Function
  const triggerRefresh = async () => {
    try {
      const [fetchedJobs, fetchedWorkers] = await Promise.all([
        apiClient.getJobs(),
        apiClient.getWorkers()
      ]);

      setIsOnline(true);
      
      const prevJobs = prevJobsRef.current;
      const prevWorkers = prevWorkersRef.current;

      // --- Diff Jobs for Events ---
      fetchedJobs.forEach((job) => {
        const prevJob = prevJobs.find((j) => j.id === job.id);
        if (!prevJob) {
          addEvent('job', `Job #${job.id} (${job.type}) created with status PENDING`, 'info');
        } else {
          if (prevJob.status !== job.status) {
            let eventType: 'info' | 'success' | 'warning' | 'error' = 'info';
            if (job.status === 'COMPLETED') eventType = 'success';
            if (job.status === 'FAILED') eventType = 'warning';
            if (job.status === 'DEAD') eventType = 'error';

            addEvent(
              'job',
              `Job #${job.id} transitioned status: ${prevJob.status} ➔ ${job.status} (Attempts: ${job.attempts}/${job.maxAttempts})`,
              eventType
            );
          }
          if (!prevJob.worker && job.worker) {
            addEvent('worker', `Worker '${job.worker.hostname}' claimed Job #${job.id}`, 'info');
          }
        }
      });

      // --- Diff Workers for Events ---
      fetchedWorkers.forEach((worker) => {
        const prevWorker = prevWorkers.find((w) => w.id === worker.id);
        if (!prevWorker) {
          addEvent('worker', `New Worker '${worker.hostname}' registered (Status: ${worker.status})`, 'success');
        } else {
          if (prevWorker.status !== worker.status) {
            let eventType: 'info' | 'success' | 'warning' | 'error' = 'info';
            if (worker.status === 'ACTIVE') eventType = 'success';
            if (worker.status === 'DRAINING') eventType = 'warning';
            if (worker.status === 'DEAD') eventType = 'error';

            addEvent(
              'worker',
              `Worker '${worker.hostname}' changed status: ${prevWorker.status} ➔ ${worker.status}`,
              eventType
            );
          }
          // Heartbeat check (if heartbeat timestamp changed)
          if (prevWorker.lastHeartbeat !== worker.lastHeartbeat && worker.status === 'ACTIVE') {
            // Heartbeats happen often, but let's log them to reinforce system awareness
            addEvent('worker', `Worker '${worker.hostname}' checked in (heartbeat timestamp updated)`, 'info');
          }
        }
      });

      // Detect worker recovery sweeps
      const deadWorkerCount = fetchedWorkers.filter(w => w.status === 'DEAD').length;
      const prevDeadWorkerCount = prevWorkers.filter(w => w.status === 'DEAD').length;
      if (deadWorkerCount > prevDeadWorkerCount) {
        addEvent('recovery', `RecoveryScheduler: Stale heartbeat detected. Stale worker(s) marked DEAD. Releasing claimed jobs back to PENDING.`, 'error');
      }

      // Detect auto-scaling changes
      const activeCount = fetchedWorkers.filter(w => w.status === 'ACTIVE').length;
      const prevActiveCount = prevWorkers.filter(w => w.status === 'ACTIVE').length;
      if (activeCount !== prevActiveCount) {
        const msg = activeCount > prevActiveCount 
          ? `ScalingScheduler: Spawned worker threads. Active workers increased: ${prevActiveCount} ➔ ${activeCount}`
          : `ScalingScheduler: Drained idle worker threads. Active workers decreased: ${prevActiveCount} ➔ ${activeCount}`;
        addEvent('scaling', msg, 'success');
      }

      // Store in State and Ref
      setJobs(fetchedJobs);
      setWorkers(fetchedWorkers);
      prevJobsRef.current = fetchedJobs;
      prevWorkersRef.current = fetchedWorkers;

      const pendingCount = fetchedJobs.filter((j) => j.status === 'PENDING').length;
      const runningCount = fetchedJobs.filter((j) => j.status === 'RUNNING').length;
      const activeWorkersCount = fetchedWorkers.filter((w) => w.status === 'ACTIVE').length;

      const newPoint: HistoryPoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        pending: pendingCount,
        running: runningCount,
        workers: activeWorkersCount,
      };

      setBacklogHistory((prev) => {
        // Only add if it's different from the last point or if we don't have many points, to avoid duplicates
        const last = prev[prev.length - 1];
        if (last && last.pending === newPoint.pending && last.running === newPoint.running && last.workers === newPoint.workers && prev.length >= 30) {
          // Update time of last point
          return [...prev.slice(0, -1), { ...last, time: newPoint.time }];
        }
        return [...prev.slice(-29), newPoint];
      });

    } catch (error) {
      if (isOnline) {
        setIsOnline(false);
        addEvent('system', 'Backend system connection lost. Retrying connection...', 'error');
      }
    }
  };

  // Polling Loop
  useEffect(() => {
    if (!isPollingActive) return;

    // Initial fetch
    triggerRefresh();

    const interval = setInterval(() => {
      triggerRefresh();
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [isPollingActive, isOnline]);

  // Connection Checker when offline
  useEffect(() => {
    if (isOnline) return;

    const interval = setInterval(async () => {
      const ok = await apiClient.checkConnection();
      if (ok) {
        setIsOnline(true);
        addEvent('system', 'Backend connection re-established successfully!', 'success');
        triggerRefresh();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // Demo Mode Scheduler
  useEffect(() => {
    if (!isDemoModeActive) return;

    // Add a starting event
    addEvent('system', 'Demo Mode enabled. Simulating automatic traffic payload injection.', 'success');

    // Create a job every 18 seconds
    const interval = setInterval(async () => {
      try {
        const type = JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)];
        const payloads = MOCK_PAYLOADS[type];
        const payload = payloads[Math.floor(Math.random() * payloads.length)];

        addEvent('system', `Demo Mode: Submitting a mock ${type} job payload`, 'info');
        await apiClient.createJob({ type, payload });
        triggerRefresh();
      } catch (err) {
        console.error('Demo Mode Job Submission Failed:', err);
      }
    }, 18000);

    return () => {
      clearInterval(interval);
      addEvent('system', 'Demo Mode disabled.', 'warning');
    };
  }, [isDemoModeActive]);

  // Initial event setup
  useEffect(() => {
    addEvent('system', 'Job Queue Dashboard Initialized. Connecting to backend...', 'info');
  }, []);

  return (
    <AppContext.Provider
      value={{
        jobs,
        workers,
        events,
        backlogHistory,
        isOnline,
        isPollingActive,
        setIsPollingActive,
        isDemoModeActive,
        setIsDemoModeActive,
        triggerRefresh,
        addManualEvent,
        clearEvents
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
