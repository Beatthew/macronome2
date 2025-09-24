import React from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface MetronomeControlsProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onClearDots: () => void;
}

export function MetronomeControls({ 
  bpm, 
  onBpmChange, 
  isPlaying, 
  onPlayToggle, 
  onClearDots 
}: MetronomeControlsProps) {
  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      {/* BPM Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Speed</span>
          <span className="text-sm font-medium">{bpm.toFixed(1)} BPM</span>
        </div>
        <Slider
          value={[bpm]}
          onValueChange={(value) => onBpmChange(value[0])}
          min={40}
          max={200}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearDots}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Clear dots
        </Button>
        
        <Button
          onClick={onPlayToggle}
          size="sm"
          className="flex items-center gap-2 px-6"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Play
            </>
          )}
        </Button>
      </div>
    </div>
  );
}