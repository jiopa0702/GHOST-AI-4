"use client";

import type { DragEvent } from "react";
import { Button } from "@/components/ui/button";

import type { CanvasNodeData } from "@/types/canvas";

const dragType = "application/x-ghost-canvas-shape";

export type ShapePreset = {
  shape: CanvasNodeData["shape"];
  width: number;
  height: number;
};

export const shapePresets: ShapePreset[] = [
  { shape: "rectangle", width: 180, height: 100 },
  { shape: "diamond", width: 160, height: 140 },
  { shape: "circle", width: 120, height: 120 },
  { shape: "pill", width: 160, height: 80 },
  { shape: "cylinder", width: 140, height: 160 },
  { shape: "hexagon", width: 160, height: 140 },
];

function ShapeIcon({ shape }: { shape: CanvasNodeData["shape"] }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="size-5">
      {shape === "rectangle" && <rect {...common} x="5" y="7" width="22" height="18" />}
      {shape === "diamond" && (
        <polygon {...common} points="16,4 28,16 16,28 4,16" />
      )}
      {shape === "circle" && <circle {...common} cx="16" cy="16" r="11" />}
      {shape === "pill" && (
        <rect {...common} x="4" y="9" width="24" height="14" rx="7" />
      )}
      {shape === "cylinder" && (
        <>
          <path {...common} d="M5 8v16c0 2.2 4.9 4 11 4s11-1.8 11-4V8" />
          <ellipse {...common} cx="16" cy="8" rx="11" ry="4" />
          <path {...common} d="M5 16c0 2.2 4.9 4 11 4s11-1.8 11-4" />
        </>
      )}
      {shape === "hexagon" && (
        <polygon {...common} points="9,4 23,4 29,16 23,28 9,28 3,16" />
      )}
    </svg>
  );
}

type ShapePanelProps = {
  onShapeDragStart: (shape: ShapePreset, x: number, y: number) => void;
  onShapeDragEnd: () => void;
};

function startShapeDrag(
  event: DragEvent<HTMLButtonElement>,
  shape: ShapePreset,
  onShapeDragStart: ShapePanelProps["onShapeDragStart"]
) {
  event.dataTransfer.setData(dragType, JSON.stringify(shape));
  event.dataTransfer.effectAllowed = "copy";
  onShapeDragStart(shape, event.clientX, event.clientY);
  const transparentImage = new Image();
  transparentImage.src =
    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  event.dataTransfer.setDragImage(transparentImage, 0, 0);
}

export function ShapePanel({
  onShapeDragStart,
  onShapeDragEnd,
}: ShapePanelProps) {
  return (
    <div
      aria-label="Canvas shapes"
      className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-surface/95 p-1.5 shadow-xl backdrop-blur"
    >
      {shapePresets.map((shape) => (
        <Button
          key={shape.shape}
          type="button"
          variant="ghost"
          size="icon"
          draggable
          aria-label={`Drag ${shape.shape}`}
          title={shape.shape}
          onDragStart={(event) => startShapeDrag(event, shape, onShapeDragStart)}
          onDragEnd={onShapeDragEnd}
          className="cursor-grab rounded-full text-copy-secondary hover:text-copy-primary active:cursor-grabbing"
        >
          <ShapeIcon shape={shape.shape} />
        </Button>
      ))}
    </div>
  );
}
