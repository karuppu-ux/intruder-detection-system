export enum SecurityStatus {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  DANGER = 'DANGER'
}

export interface DetectionEvent {
  id: string;
  timestamp: Date;
  type: 'walking' | 'crawling' | 'climbing' | 'loitering';
  confidence: number;
  status: SecurityStatus;
  message: string;
  thumbnail?: string; // Base64 image string
}

export interface SystemStats {
  fps: number;
  activeCameras: number;
  uptime: string;
  totalAlerts: number;
}

export interface ZoneRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ViewState = 'landing' | 'dashboard';