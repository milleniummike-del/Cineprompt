
import { ShotType, CameraAngle, CameraMovement, Timing } from './types';

export const SHOT_TYPES = Object.values(ShotType);
export const CAMERA_ANGLES = Object.values(CameraAngle);
export const CAMERA_MOVEMENTS = Object.values(CameraMovement);

export const TIMING_OPTIONS: Timing[] = [
  '0:00',
  '0:02',
  '0:04',
  '0:08',
  '0:15',
  '0:30'
];

export const DEFAULT_CAMERA_INSTRUCTIONS = [
  { category: 'Shot', value: ShotType.WIDE, timing: '0:00' },
  { category: 'Angle', value: CameraAngle.EYE_LEVEL, timing: '0:00' },
];

export const CATEGORY_ICONS = {
  Shot: 'Frame',
  Angle: 'Eye',
  Movement: 'Move',
};

export const CATEGORY_COLORS = {
  Shot: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Angle: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Movement: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};
