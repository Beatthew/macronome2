import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface BpmControlsProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
}

export function BpmControls({ bpm, onBpmChange }: BpmControlsProps) {
  const handleIncrease = () => {
    onBpmChange(Math.min(200, bpm + 1));
  };

  const handleDecrease = () => {
    onBpmChange(Math.max(40, bpm - 1));
  };

  return (
    <div className="flex items-center justify-center gap-8">
      <button
        onClick={handleDecrease}
        className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center
                 hover:bg-white hover:text-gray-800 transition-colors"
      >
        <Minus className="h-6 w-6" />
      </button>
      
      <div className="text-center">
        <div className="text-4xl font-light text-white mb-1">
          {Math.round(bpm)}
        </div>
        <div className="text-sm text-gray-400 uppercase tracking-wider">
          BPM
        </div>
      </div>
      
      <button
        onClick={handleIncrease}
        className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center
                 hover:bg-white hover:text-gray-800 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}