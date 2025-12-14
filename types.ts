
export enum ShotType {
  EXTREME_WIDE = 'Extreme Wide Shot',
  WIDE = 'Wide Shot',
  MEDIUM = 'Medium Shot',
  CLOSE_UP = 'Close-up',
  EXTREME_CLOSE_UP = 'Extreme Close-up',
  OVER_THE_SHOULDER = 'Over-the-shoulder',
  POV = 'Point of View',
  BIRDS_EYE = 'Birds Eye Shot',
  AERIAL = 'Aerial Shot',
}

export enum CameraAngle {
  EYE_LEVEL = 'Eye Level',
  HIGH_ANGLE = 'High Angle',
  LOW_ANGLE = 'Low Angle',
  DUTCH_ANGLE = 'Dutch Angle',
  BIRDS_EYE = 'Bird\'s Eye View',
  WORM_EYE = 'Worm\'s Eye View',
}

export enum CameraMovement {
  STATIC = 'Static',
  PAN_LEFT = 'Pan Left',
  PAN_RIGHT = 'Pan Right',
  TILT_UP = 'Tilt Up',
  TILT_DOWN = 'Tilt Down',
  DOLLY_IN = 'Dolly In',
  DOLLY_OUT = 'Dolly Out',
  ZOOM_IN = 'Zoom In',
  ZOOM_OUT = 'Zoom Out',
  TRUCK_LEFT = 'Truck Left',
  TRUCK_RIGHT = 'Truck Right',
  HANDHELD = 'Handheld Shake',
  ORBIT = 'Orbit',
  CRANE_UP = 'Crane Up',
  CRANE_DOWN = 'Crane Down',
}

// Allow free text for timing (e.g. "3.5s") but keep constants for suggestions
export type Timing = string; 

export interface CameraInstruction {
  id: string;
  timing: Timing;
  category: 'Shot' | 'Angle' | 'Movement';
  value: string;
}

// Renamed from Character to Actor
export interface Actor {
  id: string;
  name: string;
  description: string; // Physical appearance and vibe
}

export interface Costume {
  id: string;
  name: string;
  description: string;
}

export interface Prop {
  id: string;
  name: string;
  description: string;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
}

// New Character entity: Link between Actor and Costume
export interface Character {
  id: string;
  name: string; // Role name
  actorId: string;
  costumeId: string;
}

export interface DialogueLine {
  id: string;
  characterId: string; // ID of the Character speaking, or empty if generic/unknown
  text: string;
}

export interface Shot {
  id: string;
  sequenceOrder: number;
  title?: string;
  initialScenePrompt: string; // Visual description of scene only (no people)
  actionPrompt: string; // Action description (HTML with tags)
  dialog: string; // Legacy field, kept for fallback
  dialogueLines: DialogueLine[]; // New structured dialogue
  cameraInstructions: CameraInstruction[];
  isExpanded?: boolean;
}

export interface StoryboardProject {
  id: string;
  title: string;
  originalIdea: string;
  actors: Actor[];
  costumes: Costume[];
  props: Prop[];
  scenes: Scene[];
  characters: Character[]; // Defined roles
  shots: Shot[];
  lastModified: number;
}
