export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DEAD';
export type WorkerStatus = 'ACTIVE' | 'DRAINING' | 'DEAD';

export interface Worker {
  id: number;
  hostname: string;
  status: WorkerStatus;
  lastHeartbeat: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: number;
  type: string;
  payload: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  runAfter: string | null;
  leaseExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  worker: Worker | null;
}

export interface SystemEvent {
  id: string;
  timestamp: Date;
  category: 'job' | 'worker' | 'scaling' | 'recovery' | 'system';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface HistoryPoint {
  time: string;
  pending: number;
  running: number;
  workers: number;
}
