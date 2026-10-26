"use client";

import { useState } from "react";
import { LayoutTemplate } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "@/components/editor/starter-templates";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

type StarterTemplatesModalProps = {
  onImport: (template: CanvasTemplate) => void;
};

type TemplatePreviewProps = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  name: string;
};

const previewWidth = 288;
const previewHeight = 150;
const previewPadding = 12;

function TemplatePreview({ nodes, edges, name }: TemplatePreviewProps) {
  const bounds = nodes.reduce(
    (current, node) => ({
      minX: Math.min(current.minX, node.position.x),
      minY: Math.min(current.minY, node.position.y),
      maxX: Math.max(current.maxX, node.position.x + node.data.width),
      maxY: Math.max(current.maxY, node.position.y + node.data.height),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }
  );
  const boundsWidth = Math.max(1, bounds.maxX - bounds.minX);
  const boundsHeight = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.min(
    (previewWidth - previewPadding * 2) / boundsWidth,
    (previewHeight - previewPadding * 2) / boundsHeight
  );
  const offsetX =
    (previewWidth - boundsWidth * scale) / 2 - bounds.minX * scale;
  const offsetY =
    (previewHeight - boundsHeight * scale) / 2 - bounds.minY * scale;
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  const getNodeRect = (node: CanvasNode) => ({
    x: node.position.x * scale + offsetX,
    y: node.position.y * scale + offsetY,
    width: node.data.width * scale,
    height: node.data.height * scale,
  });

  return (
    <svg
      aria-label={`${name} diagram preview`}
      className="h-[150px] w-full rounded-xl border border-border bg-base"
      role="img"
      viewBox={`0 0 ${previewWidth} ${previewHeight}`}
    >
      {edges.map((edge) => {
        const source = nodesById.get(edge.source);
        const target = nodesById.get(edge.target);
        if (!source || !target) {
          return null;
        }

        const sourceRect = getNodeRect(source);
        const targetRect = getNodeRect(target);
        return (
          <line
            key={edge.id}
            x1={sourceRect.x + sourceRect.width / 2}
            y1={sourceRect.y + sourceRect.height / 2}
            x2={targetRect.x + targetRect.width / 2}
            y2={targetRect.y + targetRect.height / 2}
            stroke="var(--text-muted)"
            strokeWidth="1.25"
          />
        );
      })}
      {nodes.map((node) => {
        const rect = getNodeRect(node);
        const color = node.data.color;
        const shape = node.data.shape;
        const common = {
          fill: color,
          fillOpacity: 0.8,
          stroke: color,
          strokeWidth: 1.25,
        };

        return (
          <g key={node.id}>
            {shape === "circle" ? (
              <ellipse
                {...common}
                cx={rect.x + rect.width / 2}
                cy={rect.y + rect.height / 2}
                rx={rect.width / 2}
                ry={rect.height / 2}
              />
            ) : shape === "diamond" ? (
              <polygon
                {...common}
                points={`${rect.x + rect.width / 2},${rect.y} ${rect.x + rect.width},${rect.y + rect.height / 2} ${rect.x + rect.width / 2},${rect.y + rect.height} ${rect.x},${rect.y + rect.height / 2}`}
              />
            ) : shape === "hexagon" ? (
              <polygon
                {...common}
                points={`${rect.x + rect.width * 0.25},${rect.y} ${rect.x + rect.width * 0.75},${rect.y} ${rect.x + rect.width},${rect.y + rect.height / 2} ${rect.x + rect.width * 0.75},${rect.y + rect.height} ${rect.x + rect.width * 0.25},${rect.y + rect.height} ${rect.x},${rect.y + rect.height / 2}`}
              />
            ) : (
              <rect
                {...common}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={
                  shape === "pill"
                    ? rect.height / 2
                    : shape === "cylinder"
                      ? Math.min(6, rect.height / 5)
                      : 3
                }
              />
            )}
            {shape === "cylinder" && (
              <ellipse
                cx={rect.x + rect.width / 2}
                cy={rect.y + Math.min(6, rect.height / 5)}
                rx={rect.width / 2}
                ry={Math.min(6, rect.height / 5)}
                fill="none"
                stroke={color}
                strokeWidth="1"
              />
            )}
            <text
              x={rect.x + rect.width / 2}
              y={rect.y + rect.height / 2}
              fill={node.data.textColor ?? "var(--text-primary)"}
              fontSize={Math.max(6, Math.min(9, 10 * scale))}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {node.data.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StarterTemplatesModal({ onImport }: StarterTemplatesModalProps) {
  const [open, setOpen] = useState(false);

  const handleImport = (template: CanvasTemplate) => {
    onImport(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Browse starter templates"
        title="Starter templates"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <LayoutTemplate />
        Templates
      </Button>
      <DialogContent className="max-h-[85dvh] overflow-hidden border border-border bg-surface p-5 text-copy-primary sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Starter templates</DialogTitle>
          <DialogDescription className="text-copy-muted">
            Import a ready-made diagram to get your canvas started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[65dvh] grid-cols-1 gap-4 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <article
              key={template.id}
              className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-base p-3"
            >
              <TemplatePreview
                nodes={template.nodes}
                edges={template.edges}
                name={template.name}
              />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-copy-primary">
                  {template.name}
                </h3>
                <p className="mt-1 text-xs leading-5 text-copy-muted">
                  {template.description}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => handleImport(template)}
              >
                Import
              </Button>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
