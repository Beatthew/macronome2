import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DragDropMetronome } from './components/DragDropMetronome';
import { BpmControls } from './components/BpmControls';
import { Menu } from 'lucide-react';

interface Dot {
  id: string;
  angle: number;
  isActive?: boolean;
  type?: 'regular' | 'accent'; // accent notes are higher pitch
}

export default function App() {
  const [dots, setDots] = useState<Dot[]>([]);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [currentNoteType, setCurrentNoteType] = useState<'regular' | 'accent'>('regular');
  const startTimeRef = useRef<number>(Date.now());
  const animationRef = useRef<number>(0);
  const dotsInCollision = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousAngle = useRef<number>(0);
  const lastCollisionCheck = useRef<number>(0);

  const initializeAudio = async () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        return;
      }
    }
    
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        // Silently handle audio resume errors
      }
    }
  };

  const handlePlayToggle = async () => {
    // Initialize audio on first user interaction
    await initializeAudio();
    
    if (!isPlaying) {
      // Starting playback - reset start time to current position
      startTimeRef.current = Date.now() - (currentAngle / 360) * (60 * 1000 / bpm);
    }
    setIsPlaying(!isPlaying);
  };

  const animatePosition = useCallback(() => {
    const animate = () => {
      if (!isPlaying) return;
      
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const rotationsPerMs = bpm / (60 * 1000);
      const angle = (elapsed * rotationsPerMs * 360) % 360;
      
      // Only update if angle has changed meaningfully (prevents unnecessary renders)
      setCurrentAngle(prevAngle => {
        const diff = Math.abs(angle - prevAngle);
        if (diff > 0.5 || diff > 359.5) { // Larger threshold to reduce updates
          return angle;
        }
        return prevAngle;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  }, [isPlaying, bpm]);

  // Animation effect - only runs when playing
  useEffect(() => {
    if (isPlaying) {
      animatePosition();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, bpm, animatePosition]);

  const playClickSound = useCallback((noteType: 'regular' | 'accent' = 'regular') => {
    try {
      // Use the existing audio context instead of creating a new one each time
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different note types
      oscillator.frequency.value = noteType === 'accent' ? 1200 : 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silently handle audio errors
    }
  }, []);

  // Helper function to check if angle crossed over a dot between two positions
  const didCrossOverDot = (prevAngle: number, currAngle: number, dotAngle: number) => {
    // Normalize angles to 0-360
    const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;
    const prev = normalizeAngle(prevAngle);
    const curr = normalizeAngle(currAngle);
    const dot = normalizeAngle(dotAngle);
    
    // Handle the case where we cross the 0/360 boundary
    if (Math.abs(curr - prev) > 180) {
      // We crossed the boundary
      if (prev > curr) {
        // Going from ~360 to ~0
        return dot >= prev || dot <= curr;
      } else {
        // Going from ~0 to ~360 (shouldn't happen in normal forward motion)
        return dot >= prev && dot <= curr;
      }
    } else {
      // Normal case - check if dot is between prev and curr
      const min = Math.min(prev, curr);
      const max = Math.max(prev, curr);
      return dot >= min && dot <= max;
    }
  };

  // Check for collisions between moving dot and placed dots
  useEffect(() => {
    if (!isPlaying || dots.length === 0) return;
    
    // Throttle collision detection to prevent performance issues
    const now = Date.now();
    if (now - lastCollisionCheck.current < 16) return; // ~60fps max
    lastCollisionCheck.current = now;
    
    const prevAngle = previousAngle.current;
    const currAngle = currentAngle;
    
    // Only process if angle has changed meaningfully
    if (Math.abs(currAngle - prevAngle) < 0.5 && Math.abs(currAngle - prevAngle) < 359.5) return;
    
    dots.forEach(dot => {
      const currentDistance = Math.abs(currAngle - dot.angle);
      const normalizedCurrentDistance = Math.min(currentDistance, 360 - currentDistance);
      
      // Check if we're currently close to the dot (within collision zone)
      const inCollisionZone = normalizedCurrentDistance <= 8;
      
      // Check if we crossed over this dot since the last frame
      const crossedOver = didCrossOverDot(prevAngle, currAngle, dot.angle);
      
      if (inCollisionZone || crossedOver) {
        // If this dot wasn't in collision before, trigger sound
        if (!dotsInCollision.current.has(dot.id)) {
          dotsInCollision.current.add(dot.id);
          playClickSound(dot.type || 'regular');
        }
      } else {
        // If this dot was in collision but no longer is, remove it
        if (dotsInCollision.current.has(dot.id)) {
          dotsInCollision.current.delete(dot.id);
        }
      }
    });
    
    // Update previous angle for next frame
    previousAngle.current = currAngle;
  }, [currentAngle, dots, isPlaying, playClickSound]);

  return (
    <div className="min-h-screen bg-gray-400 text-white flex flex-col">
      {/* Header with hamburger menu */}
      <div className="p-6">
        <button className="w-8 h-8 flex items-center justify-center">
          <Menu className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* BPM Controls */}
      <div className="px-6 py-8">
        <BpmControls
          bpm={bpm}
          onBpmChange={setBpm}
        />
      </div>

      {/* Circular Metronome */}
      <div className="flex-1 flex items-center justify-center px-6">
        <DragDropMetronome
          dots={dots}
          onDotsChange={setDots}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
          currentAngle={currentAngle}
          currentNoteType={currentNoteType}
          onNoteTypeChange={setCurrentNoteType}
        />
      </div>

      {/* Bottom spacing */}
      <div className="pb-8"></div>
    </div>
  );
}