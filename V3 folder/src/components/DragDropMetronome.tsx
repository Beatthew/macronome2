import React, { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface Dot {
  id: string;
  angle: number;
  isActive?: boolean;
  type?: "regular" | "accent";
}

interface DragDropMetronomeProps {
  dots: Dot[];
  onDotsChange: (dots: Dot[]) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  currentAngle: number;
  currentNoteType: "regular" | "accent";
  onNoteTypeChange: (type: "regular" | "accent") => void;
}

export function DragDropMetronome({
  dots,
  onDotsChange,
  isPlaying,
  onPlayToggle,
  currentAngle,
  currentNoteType,
  onNoteTypeChange,
}: DragDropMetronomeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedDot, setDraggedDot] = useState<string | null>(
    null,
  );
  const [isDraggingFromSource, setIsDraggingFromSource] =
    useState(false);
  const radius = 140;
  const centerX = 180;
  const centerY = 180;

  const angleToPoint = (angle: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian),
    };
  };

  const pointToAngle = (x: number, y: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const isPointOnCircle = (x: number, y: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance >= radius - 30 && distance <= radius + 30;
  };

  // Handle dragging source note
  const handleSourceDragStart = (event: React.DragEvent) => {
    setIsDraggingFromSource(true);
    event.dataTransfer.setData("text/plain", "new-note");
  };

  const handleSourceDragEnd = () => {
    setIsDraggingFromSource(false);
  };

  // Handle drop on circle
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isPointOnCircle(x, y)) {
      const angle = pointToAngle(x, y);
      const newDot: Dot = {
        id: Date.now().toString(),
        angle,
        type: currentNoteType,
      };
      onDotsChange([...dots, newDot]);
    }
    setIsDraggingFromSource(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // Handle dragging existing dots
  const handleDotMouseDown = (
    event: React.MouseEvent,
    dotId: string,
  ) => {
    event.stopPropagation();
    setDraggedDot(dotId);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!draggedDot || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isPointOnCircle(x, y)) {
      const angle = pointToAngle(x, y);
      onDotsChange(
        dots.map((dot) =>
          dot.id === draggedDot ? { ...dot, angle } : dot,
        ),
      );
    }
  };

  const handleMouseUp = () => {
    setDraggedDot(null);
  };

  const handleDotDoubleClick = (
    event: React.MouseEvent,
    dotId: string,
  ) => {
    event.stopPropagation();
    onDotsChange(dots.filter((dot) => dot.id !== dotId));
  };

  // Touch events for mobile
  const handleDotTouchStart = (
    event: React.TouchEvent,
    dotId: string,
  ) => {
    event.preventDefault();
    setDraggedDot(dotId);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!draggedDot || !svgRef.current) return;

    const touch = event.touches[0];
    const rect = svgRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (isPointOnCircle(x, y)) {
      const angle = pointToAngle(x, y);
      onDotsChange(
        dots.map((dot) =>
          dot.id === draggedDot ? { ...dot, angle } : dot,
        ),
      );
    }
  };

  const handleTouchEnd = () => {
    setDraggedDot(null);
  };

  const currentPoint = angleToPoint(currentAngle);

  return (
    <div className="flex flex-col items-center">
      {/* Main Circle */}
      <div className="relative">
        <svg
          ref={svgRef}
          width="360"
          height="360"
          className="touch-none select-none"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="rgb(229 231 235)"
            strokeWidth="3"
            className={
              isDraggingFromSource ? "stroke-blue-400" : ""
            }
          />

          {/* Tick marks */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = i * 30 - 90;
            const radian = angle * (Math.PI / 180);
            const innerRadius = radius - 8;
            const outerRadius = radius;

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
                stroke="rgb(229 231 235)"
                strokeWidth="2"
              />
            );
          })}

          {/* Moving dot indicator - only visible when playing */}
          {isPlaying && (
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r="6"
              fill="white"
            />
          )}

          {/* User-placed dots */}
          {dots.map((dot) => {
            const point = angleToPoint(dot.angle);
            const isAccent = dot.type === "accent";
            return (
              <circle
                key={dot.id}
                cx={point.x}
                cy={point.y}
                r="8"
                fill={isAccent ? "#f87171" : "black"}
                stroke="white"
                strokeWidth="2"
                className={`cursor-move transition-colors ${
                  isAccent
                    ? "hover:fill-red-400"
                    : "hover:fill-gray-800"
                }`}
                onMouseDown={(e) =>
                  handleDotMouseDown(e, dot.id)
                }
                onDoubleClick={(e) =>
                  handleDotDoubleClick(e, dot.id)
                }
                onTouchStart={(e) =>
                  handleDotTouchStart(e, dot.id)
                }
              />
            );
          })}
        </svg>

        {/* Center play button */}
        <button
          onClick={onPlayToggle}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                   w-16 h-16 bg-white rounded-full flex items-center justify-center 
                   hover:bg-gray-100 transition-colors shadow-lg"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 text-gray-800" />
          ) : (
            <Play className="h-6 w-6 text-gray-800 ml-1" />
          )}
        </button>
      </div>

      {/* Arrow pointing up */}
      <div className="mt-8 mb-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 4L12 20M12 4L6 10M12 4L18 10"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Add note source */}
      <div className="flex flex-col items-center text-center">
        <div
          draggable
          onDragStart={handleSourceDragStart}
          onDragEnd={handleSourceDragEnd}
          onClick={() =>
            onNoteTypeChange(
              currentNoteType === "regular"
                ? "accent"
                : "regular",
            )
          }
          className={`w-8 h-8 rounded-full cursor-grab active:cursor-grabbing 
                   transition-colors mb-2 ${
                     currentNoteType === "accent"
                       ? "bg-red-400 hover:bg-red-300"
                       : "bg-black hover:bg-gray-800"
                   }`}
        />
        <div className="text-white">
          <div className="mb-1">Add a note</div>
          <div className="text-sm text-gray-400">
            {currentNoteType === "accent"
              ? "(High pitch - tap to change)"
              : "(Tap to make accent)"}
          </div>
        </div>
      </div>
    </div>
  );
}