import { SecurityStatus, RegisteredProfile } from './types';

export const SIMULATION_INTERVAL = 2000;

export const INITIAL_STATS = {
  fps: 30,
  activeCameras: 1,
  uptime: '00:00:00',
  totalAlerts: 0
};

export const MOCK_PROFILES: RegisteredProfile[] = [
  {
    id: 'p1',
    name: 'Homeowner',
    role: 'family',
    signature: {
      ratios: { torsoAspect: 0.85, limbProportion: 0.72, frameScale: 1.15, extremityRatio: 0.92 },
      gaitCadence: 1.1,
      stabilityScore: 0.95,
      hash: 'ff88aa'
    }
  },
  {
    id: 'p2',
    name: 'Sarah (Friend)',
    role: 'guest',
    signature: {
      ratios: { torsoAspect: 0.65, limbProportion: 0.85, frameScale: 0.95, extremityRatio: 1.05 },
      gaitCadence: 1.4,
      stabilityScore: 0.88,
      hash: 'cc44bb'
    }
  }
];

export const MOCK_FEATURES = [
  {
    title: "Shape Recognition",
    subtitle: "Anti-Mask Tech",
    description: "Identifies people by their body shape and walking style, even if they wear a mask.",
    icon: "fingerprint"
  },
  {
    title: "Behavior Logic",
    subtitle: "Movement Analysis",
    description: "Smart AI understands different actions like crawling or climbing with high accuracy.",
    icon: "brain"
  },
  {
    title: "Smart Alerts",
    subtitle: "No False Alarms",
    description: "Only alerts you for unknown people or aggressive behaviors, ignoring pets and wind.",
    icon: "shield-alert"
  }
];

export const ACTION_THRESHOLDS = {
  FIGHTING_VELOCITY: 0.05,
  MATCH_THRESHOLD: 0.12,
};