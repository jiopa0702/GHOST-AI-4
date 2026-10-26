"use client";

import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useEventListener, useOthers, shallow } from "@liveblocks/react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useState, type CSSProperties } from "react";
import { LoaderCircle } from "lucide-react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import { taskFeedMessageSchema, type TaskFeedMessage } from "@/types/task";

const ClientUserButton = dynamic(
  () => import("@clerk/nextjs").then(({ UserButton }) => UserButton),
  {
    ssr: false,
    loading: () => <span aria-hidden="true" className="size-8 rounded-full bg-subtle" />,
  }
);

type Collaborator = {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor: { x: number; y: number } | null;
  thinking: boolean;
};

export function CanvasPresence() {
  const [activity, setActivity] = useState<TaskFeedMessage[]>([]);
  const { user } = useUser();
  const { flowToScreenPosition } = useReactFlow<CanvasNode, CanvasEdge>();
  const viewport = useViewport();
  const currentUserId = user?.id ?? null;
  const collaborators = useOthers(
    (others) =>
      others
        .filter((other) => other.id !== currentUserId)
        .map((other) => ({
          id: other.id,
          name: other.info.name,
          avatar: other.info.avatar,
          color: other.info.color,
          cursor: other.presence.cursor,
          thinking: other.presence.thinking,
        })),
    shallow
  );
  useEventListener(({ event }) => {
    if (event.type !== "ai-status-feed" && event.type !== "ai-status") return;

    const parsedStatus = taskFeedMessageSchema.safeParse(event);
    if (!parsedStatus.success) {
      console.warn("Ignoring an invalid shared AI status message.", parsedStatus.error);
      return;
    }
    setActivity((current) => [...current, parsedStatus.data].slice(-5));
  });
  const visibleCollaborators = collaborators.slice(0, 5);
  const overflowCount = Math.max(0, collaborators.length - visibleCollaborators.length);

  return (
    <>
      <div
        aria-label="Active collaborators"
        className="absolute right-4 top-4 z-30 flex items-center rounded-full border border-border bg-surface/95 p-1 shadow-lg backdrop-blur-sm"
        role="group"
      >
        {visibleCollaborators.length > 0 && (
          <>
            <div className="flex items-center pl-1">
              {visibleCollaborators.map((collaborator, index) => (
                <CollaboratorAvatar
                  key={collaborator.id}
                  collaborator={collaborator}
                  index={index}
                />
              ))}
              {overflowCount > 0 && (
                <span
                  aria-label={`${overflowCount} more collaborators`}
                  className="-ml-2 flex size-8 items-center justify-center rounded-full border-2 border-base bg-elevated text-[10px] font-medium text-copy-secondary"
                >
                  +{overflowCount}
                </span>
              )}
            </div>
            <span aria-hidden="true" className="mx-2 h-6 w-px bg-border" />
          </>
        )}
        <div className="flex size-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-base">
          <ClientUserButton
            appearance={{ elements: { avatarBox: "!size-8" } }}
          />
        </div>
      </div>
      {activity.length > 0 && (
        <div
          aria-label="Shared AI activity"
          aria-live="polite"
          className="fixed left-4 top-[4.5rem] z-30 flex w-64 flex-col gap-2"
          role="status"
        >
          {activity.map((item, index) => (
            <div
              key={`${item.runId}-${item.timestamp}`}
              className={`rounded-xl border bg-surface/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm ${
                item.status === "error" ? "border-error/50 text-error" : "border-surface-border text-copy-secondary"
              }`}
              style={{ opacity: 0.65 + (index / activity.length) * 0.35 }}
            >
              <div className="flex items-center gap-2">
                {item.status === "started" || item.status === "processing" ? (
                  <LoaderCircle aria-hidden="true" className="size-3.5 shrink-0 animate-spin text-ai-text" />
                ) : (
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand" />
                )}
                <span className="font-medium text-copy-primary">Ghost AI</span>
              </div>
              <p className="mt-1 pl-[22px] leading-4">{item.message}</p>
            </div>
          ))}
        </div>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
        data-flow-viewport={`${viewport.x},${viewport.y},${viewport.zoom}`}
      >
        {collaborators.map((collaborator) => {
          if (!collaborator.cursor) return null;
          const screenPosition = flowToScreenPosition(collaborator.cursor);
          return (
            <CollaboratorCursor
              key={collaborator.id}
              collaborator={collaborator}
              position={screenPosition}
            />
          );
        })}
      </div>
    </>
  );
}

function CollaboratorAvatar({
  collaborator,
  index,
}: {
  collaborator: Collaborator;
  index: number;
}) {
  const initials = collaborator.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-label={collaborator.name}
      className={`relative flex size-8 items-center justify-center overflow-hidden rounded-full border-2 border-base bg-elevated text-[10px] font-semibold text-copy-primary ${
        index > 0 ? "-ml-2" : ""
      }`}
      role="img"
      title={collaborator.thinking ? `${collaborator.name} is thinking` : collaborator.name}
      style={{ zIndex: 5 - index }}
    >
      {collaborator.avatar ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${collaborator.avatar}")` }}
        />
      ) : (
        <span>{initials || "?"}</span>
      )}
      {collaborator.thinking && (
        <span className="absolute inset-0 flex items-center justify-center bg-base/70">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-ai-text" />
        </span>
      )}
    </span>
  );
}

function CollaboratorCursor({
  collaborator,
  position,
}: {
  collaborator: Collaborator;
  position: { x: number; y: number };
}) {
  if (!collaborator.cursor) return null;

  return (
    <div
      className="absolute left-0 top-0 flex items-start gap-1.5 transition-transform duration-75"
      style={
        {
          transform: `translate(${position.x}px, ${position.y}px)`,
          "--cursor-color": collaborator.color,
        } as CSSProperties
      }
    >
      <svg
        aria-hidden="true"
        className="size-4 shrink-0 drop-shadow-sm"
        viewBox="0 0 16 20"
      >
        <path
          d="M1 1v15l4-4 3 6 3-1.5-3-5.5h6L1 1Z"
          fill="var(--cursor-color)"
          stroke="var(--bg-base)"
          strokeLinejoin="round"
          strokeWidth="1.25"
        />
      </svg>
      <span
        className="mt-3 inline-flex max-w-36 items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-4 text-white shadow-sm"
        style={{ backgroundColor: collaborator.color }}
      >
        {collaborator.thinking && (
          <LoaderCircle
            aria-hidden="true"
            className="size-3 shrink-0 animate-spin"
          />
        )}
        {collaborator.name}
      </span>
    </div>
  );
}
