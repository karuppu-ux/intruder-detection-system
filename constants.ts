import { SecurityStatus } from './types';

export const SIMULATION_INTERVAL = 2000; // ms

export const INITIAL_STATS = {
  fps: 30,
  activeCameras: 1,
  uptime: '00:00:00',
  totalAlerts: 0
};

export const MOCK_FEATURES = [
  {
    title: "The Eyes",
    subtitle: "YOLO11-Pose",
    description: "Utilizes the latest YOLO11 architecture for real-time keypoint detection, offering superior accuracy and speed with <10ms latency.",
    icon: "eye"
  },
  {
    title: "The Brain",
    subtitle: "Action Recognition",
    description: "Analyzes temporal pose data to classify complex actions (crawling, climbing, walking) with high confidence.",
    icon: "brain"
  },
  {
    title: "The Decision",
    subtitle: "Smart Alerts",
    description: "Filters out false alarms (cats, shadows) and only alerts on suspicious human behavior.",
    icon: "shield-alert"
  }
];

export const DEMO_LOGS = [
  { id: '1', timestamp: new Date(Date.now() - 100000), type: 'normal', confidence: 0.95, status: SecurityStatus.SAFE, message: 'Person walking detected' },
  { id: '2', timestamp: new Date(Date.now() - 80000), type: 'normal', confidence: 0.92, status: SecurityStatus.SAFE, message: 'Person walking detected' },
];

// Heuristic Thresholds for Action Detection
export const ACTION_THRESHOLDS = {
  FIGHTING_VELOCITY: 0.05, // Movement speed of wrists/ankles per frame
  STEALING_HAND_HEIGHT: 0.4, // Relative Y position of hands
  ASSAULT_PROXIMITY: 0.1, // If multiple skeletons, how close they are
  VANDALISM_ARM_EXTENSION: 0.8, // Arm extension ratio
};