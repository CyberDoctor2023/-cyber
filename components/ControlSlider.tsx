import React from 'react';

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, min, max, onChange }) => {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-mac-subtext tracking-wide">{label}</label>
      </div>
      <div className="relative flex items-center h-6">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-mac-accent hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-gray-300/50 transition-all"
        />
      </div>
    </div>
  );
};

export default ControlSlider;