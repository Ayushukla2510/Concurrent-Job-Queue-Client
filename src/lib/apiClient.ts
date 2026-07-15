import { Job, Worker, JobStatus } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class ApiClient {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null as unknown as T;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // --- Connection Check ---
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/actuator/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  // --- Jobs Endpoints ---
  async getJobs(): Promise<Job[]> {
    return this.request<Job[]>('/jobs');
  }

  async getJob(id: number): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`);
  }

  async createJob(jobData: { type: string; payload: string; runAfter?: string }): Promise<Job> {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async createJobsBulk(jobs: Array<{ type: string; payload: string }>): Promise<Job[]> {
    return this.request<Job[]>('/jobs/bulk', {
      method: 'POST',
      body: JSON.stringify(jobs),
    });
  }

  async completeJob(id: number): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/complete`, {
      method: 'POST',
    });
  }

  async failJob(id: number): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/fail`, {
      method: 'POST',
    });
  }

  async reviveJob(id: number, type: string, payload: string): Promise<Job> {
    return this.request<Job>('/jobs/revive', {
      method: 'POST',
      body: JSON.stringify({ id, type, payload }),
    });
  }

  // --- Workers Endpoints ---
  async getWorkers(): Promise<Worker[]> {
    return this.request<Worker[]>('/workers');
  }

  async getWorker(id: number): Promise<Worker> {
    return this.request<Worker>(`/workers/${id}`);
  }

  async registerWorker(hostname: string): Promise<Worker> {
    return this.request<Worker>('/workers/register', {
      method: 'POST',
      body: JSON.stringify({ hostname }),
    });
  }

  async sendHeartbeat(id: number): Promise<Worker> {
    return this.request<Worker>(`/workers/${id}/heartbeat`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
