
export enum SecurityStatus {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  DANGER = 'DANGER'
}

export type ActionType = 
  // Safety/Crimes
  | 'normal' | 'fighting' | 'stealing' | 'climbing' | 'crawling' | 'concealment' | 'burglary' 
  // Postures
  | 'sitting' | 'standing' | 'lying_down' | 'crouching' | 'jumping' | 'falling' | 'loitering' | 'walking'
  // Gestures
  | 'waving' | 'surrender' | 'pointing' | 'crossed_arms' | 'hands_on_hips' | 'clapping'
  // Emotions/States (Inferred from body language)
  | 'distressed' | 'confused' | 'aggressive' | 'defeated' | 'none';

export interface DetectionEvent {
  id: string;
  timestamp: Date;
  type: ActionType;
  confidence: number;
  status: SecurityStatus;
  message: string;
  thumbnail?: string;
  aiSummary?: string;
  matchedIdentity?: string;
}

export interface SkeletalSignature {
  ratios: {
    torsoAspect: number;    // Shoulder Width / Torso Height
    limbProportion: number; // Arm Length / Leg Length
    frameScale: number;     // Shoulder Width / Hip Width
    extremityRatio: number; // Forearm / Upper Arm
  };
  gaitCadence: number;
  stabilityScore: number;
  hash: string;
}

export interface RegisteredProfile {
  id: string;
  name: string;
  role: 'family' | 'guest' | 'staff';
  signature: SkeletalSignature;
  lastSeen?: Date;
}

export interface ZoneRect { x: number; y: number; w: number; h: number; }
export type ViewState = 'landing' | 'dashboard';
export type SimulationScenario = 'none' | 'walking' | 'crawling' | 'fighting' | 'stealing' | 'climbing';

export interface AIAnalysis {
  riskScore: number;
  summary: string;
  recommendation: string;
  contextProfile?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
