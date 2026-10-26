import type { CSSProperties } from "react";

import { NODE_COLORS, type CanvasNodeData } from "@/types/canvas";

type CanvasNodeVisualProps = {
  shape: CanvasNodeData["shape"];
  color: string;
  textColor?: string;
  label?: string;
  selected?: boolean;
  preview?: boolean;
};

type SvgCanvasShape = "diamond" | "hexagon" | "cylinder";

function isSvgShape(shape: CanvasNodeData["shape"]): shape is SvgCanvasShape {
  return shape === "diamond" || shape === "hexagon" || shape === "cylinder";
}

export function CanvasNodeVisual({
  shape,
  color,
  textColor = "#EDEDED",
  label,
  selected = false,
  preview = false,
}: CanvasNodeVisualProps) {
  const outlineColor = `color-mix(in srgb, ${color} ${selected ? 100 : 62}%, transparent)`;
  const hasPaletteFill = NODE_COLORS.some((palette) => palette.background === color);
  const fillColor =
    preview || !hasPaletteFill
      ? `color-mix(in srgb, ${color} 12%, var(--bg-surface))`
      : color;
  const shapeStyle: CSSProperties = {
    borderColor: outlineColor,
    backgroundColor: fillColor,
    borderWidth: selected ? 2.5 : 1.5,
  };

  return (
    <div
      data-shape={shape}
      className={`relative grid h-full w-full place-items-center text-center text-sm text-copy-primary ${
        preview ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {isSvgShape(shape) ? (
        <svg
          aria-hidden="true"
          className="absolute inset-0 size-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d={svgPathByShape[shape]}
            fill={fillColor}
            stroke={outlineColor}
            strokeWidth={selected ? 2.5 : 1.5}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
          {shape === "cylinder" && (
            <path
              d="M10 20 C10 25.5 27.9 30 50 30 S90 25.5 90 20"
              fill="none"
              stroke={outlineColor}
              strokeWidth={selected ? 2.5 : 1.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      ) : (
        <div
          aria-hidden="true"
          className={`absolute inset-0 ${
            shape === "pill" || shape === "circle" ? "rounded-full border" : "border"
          }`}
          style={shapeStyle}
        />
      )}
      {label ? (
        <span
          className="relative z-10 max-w-full break-words px-5"
          style={{ color: textColor }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

const svgPathByShape: Record<"diamond" | "hexagon" | "cylinder", string> = {
  diamond: "M50 5 95 50 50 95 5 50 Z",
  hexagon: "M27 5 H73 L96 50 73 95 H27 L4 50 Z",
  cylinder:
    "M10 20 C10 14.5 27.9 10 50 10 S90 14.5 90 20 V80 C90 85.5 72.1 90 50 90 S10 85.5 10 80 Z",
};
