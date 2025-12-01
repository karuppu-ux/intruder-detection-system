export enum SecurityStatus {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  DANGER = 'DANGER'
}

export type ActionType = 
  | 'normal' 
  | 'abuse' 
  | 'arrest' 
  | 'arson' 
  | 'assault' 
  | 'burglary' 
  | 'explosion' 
  | 'fighting' 
  | 'roadaccidents' 
  | 'robbery' 
  | 'shooting' 
  | 'shoplifting' 
  | 'stealing' 
  | 'vandalism'
  | 'crawling'
  | 'loitering'
  | 'walking';

export interface DetectionEvent {
  id: string;
  timestamp: Date;
  type: ActionType;
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