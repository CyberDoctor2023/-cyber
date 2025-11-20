
export interface AppSettings {
  padding: number;
  inset: number;
  borderRadius: number;
  shadow: number;
  shadowAngle: number; // New 0-360 value
  background: string;
  aspectRatio: string;
  backgroundType: 'preset' | 'custom' | 'ai' | 'mesh';
  scale: number;
  panX: number;
  panY: number;
  meshSeed: number; // To randomize the mesh layout on click
}

export interface GradientPreset {
  name: string;
  value: string;
  thumbnail: string;
}

export interface AspectRatio {
  label: string;
  value: string;
}
