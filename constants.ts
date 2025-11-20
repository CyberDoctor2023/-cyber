
import { GradientPreset, AspectRatio } from './types';

export const GRADIENTS: GradientPreset[] = [
  { name: 'Transparent', value: 'transparent', thumbnail: 'bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-[length:10px_10px] bg-white' },
  { name: 'Desktop', value: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)', thumbnail: 'bg-gradient-to-br from-pink-300 to-pink-100' },
  { name: 'Cool', value: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)', thumbnail: 'bg-gradient-to-br from-green-300 to-blue-300' },
  { name: 'Nice', value: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)', thumbnail: 'bg-gradient-to-br from-purple-200 to-blue-200' },
  { name: 'Morning', value: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)', thumbnail: 'bg-gradient-to-br from-yellow-200 to-orange-300' },
  { name: 'Bright', value: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)', thumbnail: 'bg-gradient-to-r from-blue-400 to-cyan-300' },
  { name: 'Love', value: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', thumbnail: 'bg-gradient-to-t from-teal-400 to-purple-900' },
  { name: 'Rain', value: 'linear-gradient(to top, #5f72bd 0%, #9b23ea 100%)', thumbnail: 'bg-gradient-to-t from-indigo-400 to-purple-600' },
  { name: 'Sky', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', thumbnail: 'bg-gradient-to-br from-indigo-500 to-purple-700' },
  { name: 'Subtle Gray', value: 'linear-gradient(to bottom, #f3f4f6, #d1d5db)', thumbnail: 'bg-gradient-to-b from-gray-100 to-gray-300' },
];

export const RATIOS: AspectRatio[] = [
  { label: 'Original', value: 'auto' },
  { label: '1:1', value: '1/1' },
  { label: '4:3', value: '4/3' },
  { label: '16:9', value: '16/9' },
  { label: '9:16', value: '9/16' },
];

export const DEFAULT_SETTINGS = {
  padding: 64,        // Generous workspace
  inset: 16,          // Elegant, not too thick white border
  borderRadius: 32,   // Modern, rounder corners (Apple style)
  shadow: 40,         // Soft, professional shadow
  shadowAngle: 135,   // Classic top-left light source
  background: GRADIENTS[9].value, 
  aspectRatio: 'auto',
  backgroundType: 'mesh' as const, // Default to Aurora/Mesh
  scale: 100,
  panX: 0,
  panY: 0,
  meshSeed: 1,
};
