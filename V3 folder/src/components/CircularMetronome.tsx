import React, { useRef, useEffect, useState } from 'react';

interface Dot {
  id: string;
  angle: number;
  isActive?: boolean;
}

interface CircularMetronomeProps {
  dots: Dot[];
  onDotsChange: (dots: Dot[]) => void;
  isPlaying: boolean;
  currentAngle: number;
}

export function CircularMetronome({ dots, onDotsChange, isPlaying, currentAngle }: CircularMetronomeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedDot, setDraggedDot] = useState<string | null>(null);
  const radius = 120;
  const centerX = 150;
  const centerY = 150;

  const angleToPoint = (angle: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian)
    };
  };

  const pointToAngle = (x: number, y: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const handleCircleClick = (event: React.MouseEvent<SVGCircleElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const angle = pointToAngle(x, y);

    const newDot: Dot = {
      id: Date.now().toString(),
      angle
    };

    onDotsChange([...dots, newDot]);
  };



  const handleDotClick = (event: React.MouseEvent, dotId: string) => {
    event.stopPropagation();
    onDotsChange(dots.filter(dot => dot.id !== dotId));
  };

  const handleCircleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const angle = pointToAngle(x, y);

    const newDot: Dot = {
      id: Date.now().toString(),
      angle
    };

    onDotsChange([...dots, newDot]);
  };

  // Current position indicator
  const currentPoint = angleToPoint(currentAngle);

  return (
    <div className="flex items-center justify-center p-8">
      <svg
        ref={svgRef}
        width="300"
        height="300"
        className="touch-none select-none"
      >
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgb(71, 85, 105)"
          strokeWidth="2"
          onClick={handleCircleClick}
          onTouchStart={handleCircleTouchStart}
          className="cursor-pointer"
        />

        {/* Tick marks */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * 45) - 90;
          const radian = angle * (Math.PI / 180);
          const innerRadius = radius - 10;
          const outerRadius = radius + 5;
          
          const x1 = centerX + innerRadius * Math.cos(radian);
          const y1 = centerY + innerRadius * Math.sin(radian);
          const x2 = centerX + outerRadius * Math.cos(radian);
          const y2 = centerY + outerRadius * Math.sin(radian);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgb(71, 85, 105)"
              strokeWidth="1"
            />
          );
        })}

        {/* Moving dot indicator - always visible */}
        <circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r="3"
          fill="white"
          stroke="rgb(59, 130, 246)"
          strokeWidth="1"
        />

        {/* User-placed dots */}
        {dots.map((dot) => {
          const point = angleToPoint(dot.angle);
          return (
            <circle
              key={dot.id}
              cx={point.x}
              cy={point.y}
              r="12"
              fill="rgb(59, 130, 246)"
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-400 transition-colors"
              onClick={(e) => handleDotClick(e, dot.id)}
            />
          );
        })}
      </svg>
    </div>
  );
}