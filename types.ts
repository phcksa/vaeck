export type Role = 'admin' | 'user';

export interface User {
  username: string;
  password?: string; // Only used for check, removed in session
  name: string;
  empId: string;
  dept: string;
  role: Role;
  score: number;
  expiryDate: string; // ISO String
  createdAt: string;
}

export interface AccessCode {
  code: string;
  days: number;
  status: 'active' | 'used';
  createdBy: string;
  usedBy?: string;
  usedAt?: string;
}

export interface DbSchema {
  users: Record<string, User>;
  codes: Record<string, AccessCode>;
}

export interface ScenarioData {
  day: number;
  temp: number;
  wbc: number;
  peep: number;
  fio2: number;
  secretion: string;
}

export type Diagnosis = "No VAE" | "VAC" | "IVAC" | "PVAP";