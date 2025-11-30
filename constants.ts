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
  { id: '1', timestamp: new Date(Date.now() - 100000), type: 'walking', confidence: 0.95, status: SecurityStatus.SAFE, message: 'Person walking detected' },
  { id: '2', timestamp: new Date(Date.now() - 80000), type: 'walking', confidence: 0.92, status: SecurityStatus.SAFE, message: 'Person walking detected' },
];