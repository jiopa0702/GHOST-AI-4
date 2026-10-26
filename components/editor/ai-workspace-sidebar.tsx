"use client";

import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { RealtimeRun } from "@trigger.dev/core/v3";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useEventListener,
  useFeedMessages,
  useOthers,
  useSelf,
  useFeeds,
} from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
  Bot,
  Download,
  FileText,
  LoaderCircle,
  Send,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SpecCanvasSnapshot } from "@/components/editor/canvas-room";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  aiChatFeedMessageSchema,
  taskFeedMessageSchema,
  type AiChatFeedMessage,
  type TaskFeedMessage,
} from "@/types/task";
import type { designAgent } from "@/src/trigger/design-agent";
import type { generateSpec } from "@/src/trigger/generate-spec";

const starterPrompts = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const chatFeedId = "ai-chat";

type ActiveRun = {
  runId: string;
  publicAccessToken: string;
};

type GeneratedSpec = {
  specId: string;
  generatedAt: Date;
};

type AiWorkspaceSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  getCanvasSnapshot: () => SpecCanvasSnapshot | null;
  canGenerateSpec: boolean;
};

export function AiWorkspaceSidebar({
  isOpen,
  onClose,
  roomId,
  getCanvasSnapshot,
  canGenerateSpec,
}: AiWorkspaceSidebarProps) {
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [activeSpecRun, setActiveSpecRun] = useState<ActiveRun | null>(null);
  const [isSubmittingSpec, setIsSubmittingSpec] = useState(false);
  const [generatedSpec, setGeneratedSpec] = useState<GeneratedSpec | null>(null);
  const [specError, setSpecError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [feedSetupError, setFeedSetupError] = useState<string | null>(null);
  const [latestStatus, setLatestStatus] = useState<TaskFeedMessage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedCreationStarted = useRef(false);
  const self = useSelf((user) => ({
    id: user.id,
    name: user.info.name,
  }));
  const feedsResult = useFeeds({ limit: 50 });
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const feedExists =
    "feeds" in feedsResult &&
    (feedsResult.feeds ?? []).some((feed) => feed.feedId === chatFeedId);
  const feedMessagesResult = useFeedMessages(chatFeedId, { limit: 50 });
  const chatMessages = useMemo(() => {
    if (!("messages" in feedMessagesResult)) return [];

    const validMessages: Array<{
      id: string;
      createdAt: number;
      data: AiChatFeedMessage;
    }> = [];
    for (const message of feedMessagesResult.messages ?? []) {
      const parsedMessage = aiChatFeedMessageSchema.safeParse(message.data);
      if (!parsedMessage.success) {
        console.warn("Ignoring an invalid AI chat message.");
        continue;
      }
      validMessages.push({
        id: message.id,
        createdAt: message.createdAt,
        data: parsedMessage.data,
      });
    }
    return validMessages.sort(
      (left, right) =>
        left.createdAt - right.createdAt ||
        left.id.localeCompare(right.id)
    );
  }, [feedMessagesResult]);
  const isAiThinking = useOthers((others) =>
    others.some((other) => other.presence.thinking === true)
  );
  const isGenerationActive =
    isSubmitting ||
    activeRun !== null ||
    isAiThinking ||
    latestStatus?.status === "started" ||
    latestStatus?.status === "processing";

  useEffect(() => {
    if ("error" in feedsResult) return;
    if (!("feeds" in feedsResult) || feedExists || feedCreationStarted.current) return;

    feedCreationStarted.current = true;
    void createFeed(chatFeedId, { metadata: { name: "AI chat" } }).catch((error: unknown) => {
      console.error("Unable to initialize the AI chat feed.", error);
      setFeedSetupError("Unable to connect to room chat. Please reload and try again.");
    });
  }, [createFeed, feedExists, feedsResult]);

  useEventListener(({ event }) => {
    if (event.type !== "ai-status-feed" && event.type !== "ai-status") return;

    const parsedStatus = taskFeedMessageSchema.safeParse(event);
    if (!parsedStatus.success) {
      console.warn("Ignoring an invalid shared AI status message.", parsedStatus.error);
      return;
    }
    setLatestStatus(parsedStatus.data);
  });

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const height = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${height}px`;
    textarea.style.overflowY = textarea.scrollHeight > 160 ? "auto" : "hidden";
  }, [draft]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isGenerationActive || !feedExists || !self || isSubmitting) return;

    setIsSubmitting(true);
    setSendError(null);
    let userMessageSent = false;
    try {
      const userMessage = aiChatFeedMessageSchema.parse({
        sender: self,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      });
      await createFeedMessage(chatFeedId, userMessage, {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      });
      userMessageSent = true;
      setDraft("");

      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, roomId }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Unable to start the design task.";
        throw new Error(message);
      }
      if (
        typeof result !== "object" ||
        result === null ||
        !("runId" in result) ||
        typeof result.runId !== "string" ||
        !("publicAccessToken" in result) ||
        typeof result.publicAccessToken !== "string"
      ) {
        throw new Error("The design task returned invalid run credentials.");
      }
      setActiveRun({
        runId: result.runId,
        publicAccessToken: result.publicAccessToken,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send your message.";
      setSendError(message);
      if (!userMessageSent) setDraft(content);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunComplete = useCallback(async (
    summary: string | null,
    errorMessage: string | null
  ) => {
    const content = summary
      ? summary
      : `I couldn't complete the design task${errorMessage ? `: ${errorMessage}` : "."}`;
    try {
      const assistantMessage = aiChatFeedMessageSchema.parse({
        sender: { id: "ghost-ai", name: "Ghost AI" },
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
      });
      await createFeedMessage(chatFeedId, assistantMessage, {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Unable to publish the design task result to room chat.", error);
      setSendError("The task finished, but its reply could not be added to room chat.");
    } finally {
      setActiveRun(null);
    }
  }, [createFeedMessage]);

  const handleRunSubscriptionError = useCallback((error: Error) => {
    console.error("Unable to subscribe to the design task status.", error);
    setSendError("Unable to follow the design task's live status. Please try again.");
    setActiveRun(null);
  }, []);

  const handleGenerateSpec = async () => {
    if (isSubmittingSpec || activeSpecRun) return;

    const snapshot = getCanvasSnapshot();
    if (!snapshot) {
      setSpecError("The canvas is still loading. Try again in a moment.");
      return;
    }

    setIsSubmittingSpec(true);
    setSpecError(null);

    try {
      const generationResponse = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          chatHistory: chatMessages.map((message) => message.data),
          nodes: snapshot.nodes,
          edges: snapshot.edges,
        }),
      });
      const generationResult: unknown = await generationResponse.json().catch(() => null);
      if (!generationResponse.ok) {
        throw new Error(getResponseError(generationResult, "Unable to start spec generation."));
      }

      const runId = getStringProperty(generationResult, "runId");
      if (!runId) throw new Error("The spec task returned an invalid run ID.");

      const tokenResponse = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      const tokenResult: unknown = await tokenResponse.json().catch(() => null);
      if (!tokenResponse.ok) {
        throw new Error(getResponseError(tokenResult, "Unable to follow spec generation."));
      }

      const publicAccessToken = getStringProperty(tokenResult, "publicAccessToken");
      if (!publicAccessToken) {
        throw new Error("The spec task returned an invalid access token.");
      }

      setActiveSpecRun({ runId, publicAccessToken });
    } catch (error) {
      setSpecError(
        error instanceof Error ? error.message : "Unable to generate the specification."
      );
    } finally {
      setIsSubmittingSpec(false);
    }
  };

  const handleSpecRunComplete = useCallback(
    (specId: string | null, errorMessage: string | null) => {
      if (specId) {
        setGeneratedSpec({ specId, generatedAt: new Date() });
        setSpecError(null);
      } else {
        setSpecError(errorMessage ?? "Spec generation failed. Please try again.");
      }
      setActiveSpecRun(null);
    },
    []
  );

  const handleSpecRunSubscriptionError = useCallback((error: Error) => {
    console.error("Unable to subscribe to the spec generation status.", error);
    setSpecError("Unable to follow spec generation. Please try again.");
    setActiveSpecRun(null);
  }, []);

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleStarterPromptClick = (prompt: string) => {
    setDraft(prompt);
    textareaRef.current?.focus();
  };

  const formatMessageTime = (timestamp: string) =>
    new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp));

  return (
    <aside
      aria-label="AI Workspace"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={`fixed right-0 top-14 z-40 h-[calc(100dvh-3.5rem)] w-80 max-w-[calc(100vw-1rem)] border-l border-surface-border bg-base/95 shadow-2xl shadow-black/20 backdrop-blur-sm transition-transform duration-200 ease-out ${
        isOpen ? "" : "pointer-events-none"
      }`}
      style={{
        transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 2px))",
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-ai-text">
            <Bot aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-copy-primary">AI Workspace</h2>
            <p className="mt-0.5 text-xs text-copy-muted">collaborative with Ghost AI</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close AI Workspace"
            onClick={onClose}
          >
            <X />
          </Button>
        </header>

        <Tabs
          defaultValue="architect"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-none border-b border-surface-border bg-transparent p-2">
            <TabsTrigger
              value="architect"
              className="rounded-lg text-copy-muted data-active:bg-accent data-active:text-accent-foreground"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-lg text-copy-muted data-active:bg-accent data-active:text-accent-foreground"
            >
              Specs
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="architect"
            className="flex min-h-0 flex-1 flex-col text-copy-primary"
          >
            <div
              aria-live="polite"
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
            >
              {feedSetupError ||
              ("error" in feedsResult && feedsResult.error) ? (
                <p className="my-auto rounded-xl border border-error/40 bg-error/5 p-3 text-center text-xs text-error">
                  {feedSetupError ?? "Unable to load room chat. Please try again."}
                </p>
              ) : "messages" in feedMessagesResult && feedMessagesResult.error ? (
                <p className="my-auto rounded-xl border border-error/40 bg-error/5 p-3 text-center text-xs text-error">
                  Unable to load room chat. Please try again.
                </p>
              ) : chatMessages.length === 0 ? (
                <div className="my-auto flex flex-col items-center text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-surface-border bg-elevated text-ai-text">
                    <Bot aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-copy-primary">
                    Let&apos;s design something
                  </h3>
                  <p className="mt-2 max-w-60 text-xs leading-5 text-copy-muted">
                    Describe what you&apos;re building or start with a prompt.
                  </p>
                  <div className="mt-5 flex flex-col items-stretch gap-2">
                    {starterPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto justify-start whitespace-normal rounded-full bg-subtle px-3 py-2 text-left text-xs text-ai-text hover:bg-elevated hover:text-ai-text"
                        onClick={() => handleStarterPromptClick(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[92%] rounded-2xl px-3 py-2.5 text-sm leading-5 ${
                      message.data.role === "user"
                        ? "ml-auto border-2 border-brand/50 bg-accent-dim text-copy-primary"
                        : "mr-auto border border-surface-border bg-elevated text-ai-text"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3 text-[10px] text-copy-muted">
                      <span className="truncate font-medium">
                        {message.data.sender.name}
                      </span>
                      <time
                        dateTime={message.data.timestamp}
                        title={new Date(message.data.timestamp).toLocaleString()}
                      >
                        {formatMessageTime(message.data.timestamp)}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap break-words">
                      {message.data.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form
              className="border-t border-surface-border p-3"
              onSubmit={(event) => void handleSubmit(event)}
            >
              {isGenerationActive && (
                <div
                  aria-live="polite"
                  className="mb-2 flex items-center gap-2 rounded-lg border border-surface-border bg-subtle px-3 py-2 text-xs text-copy-secondary"
                  role="status"
                >
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-3.5 shrink-0 animate-spin text-ai-text"
                  />
                  <span className="truncate">
                    {(latestStatus?.status === "started" ||
                    latestStatus?.status === "processing"
                      ? latestStatus.text ?? latestStatus.message
                      : null) ?? "Ghost AI is working..."}
                  </span>
                </div>
              )}
              <div className="rounded-xl border border-surface-border bg-elevated p-2 focus-within:border-brand/60">
                <Textarea
                  ref={textareaRef}
                  aria-label="Message AI Architect"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Ask AI Architect..."
                  disabled={isGenerationActive || !feedExists || !self}
                  rows={2}
                  className="max-h-40 min-h-[72px] resize-none border-0 bg-transparent px-1 py-1 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-copy-muted">
                    {feedSetupError
                      ? "Room chat is unavailable"
                      : "Enter to send · Shift+Enter for a new line"}
                  </span>
                  <Button
                    type="submit"
                    size="icon-sm"
                    aria-label={isGenerationActive ? "AI is thinking" : "Send message"}
                    disabled={
                      !draft.trim() ||
                      isGenerationActive ||
                      !feedExists ||
                      !self ||
                      isSubmitting
                    }
                    className="bg-brand text-base hover:bg-brand/90"
                  >
                    {isGenerationActive ? (
                      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <Send />
                    )}
                  </Button>
                </div>
                {sendError && (
                  <p aria-live="polite" className="mt-2 text-xs text-error" role="alert">
                    {sendError}
                  </p>
                )}
              </div>
            </form>
          </TabsContent>

          <TabsContent
            value="specs"
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 text-copy-primary"
          >
            <Button
              type="button"
              className="w-full gap-2 bg-brand text-base hover:bg-brand/90"
              disabled={isSubmittingSpec || activeSpecRun !== null || !canGenerateSpec}
              onClick={() => void handleGenerateSpec()}
            >
              {isSubmittingSpec || activeSpecRun ? (
                <>
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  Generating spec...
                </>
              ) : (
                "Generate Spec"
              )}
            </Button>

            {specError && (
              <p aria-live="polite" className="rounded-xl border border-error/40 bg-error/5 p-3 text-xs text-error" role="alert">
                {specError}
              </p>
            )}

            {activeSpecRun && (
              <p aria-live="polite" className="flex items-center gap-2 rounded-xl border border-surface-border bg-subtle p-3 text-xs text-copy-secondary" role="status">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-ai-text" />
                Ghost AI is writing your specification...
              </p>
            )}

            {generatedSpec ? (
              <article className="rounded-2xl border border-surface-border bg-elevated p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-subtle text-ai-text">
                    <FileText aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-copy-primary">
                      Project specification
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-copy-muted">
                      Generated {formatMessageTime(generatedSpec.generatedAt.toISOString())}
                    </p>
                  </div>
                </div>
                <div className="mt-4 border-t border-surface-border pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {
                      window.location.assign(
                        `/api/projects/${encodeURIComponent(roomId)}/specs/${encodeURIComponent(generatedSpec.specId)}/download`
                      );
                    }}
                  >
                    <Download aria-hidden="true" />
                    Download spec
                  </Button>
                </div>
              </article>
            ) : !activeSpecRun && !specError ? (
              <div className="rounded-2xl border border-dashed border-surface-border p-4 text-center text-xs leading-5 text-copy-muted">
                Generate a specification from this project&apos;s canvas and chat.
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
      {activeRun && (
        <DesignRunSubscription
          key={activeRun.runId}
          runId={activeRun.runId}
          publicAccessToken={activeRun.publicAccessToken}
          onComplete={handleRunComplete}
          onError={handleRunSubscriptionError}
        />
      )}
      {activeSpecRun && (
        <SpecRunSubscription
          key={activeSpecRun.runId}
          runId={activeSpecRun.runId}
          publicAccessToken={activeSpecRun.publicAccessToken}
          onComplete={handleSpecRunComplete}
          onError={handleSpecRunSubscriptionError}
        />
      )}
    </aside>
  );
}

function SpecRunSubscription({
  runId,
  publicAccessToken,
  onComplete,
  onError,
}: {
  runId: string;
  publicAccessToken: string;
  onComplete: (specId: string | null, errorMessage: string | null) => void;
  onError: (error: Error) => void;
}) {
  const completionHandled = useRef(false);
  const handleComplete = useCallback(
    (run: RealtimeRun<typeof generateSpec>, error?: Error) => {
      if (completionHandled.current) return;
      completionHandled.current = true;
      const specId = run.isSuccess ? run.output?.specId ?? null : null;
      onComplete(specId, error?.message ?? run.error?.message ?? null);
    },
    [onComplete]
  );
  const { error } = useRealtimeRun<typeof generateSpec>(runId, {
    accessToken: publicAccessToken,
    skipColumns: ["payload"],
    onComplete: handleComplete,
  });

  useEffect(() => {
    if (error && !completionHandled.current) {
      completionHandled.current = true;
      onError(error);
    }
  }, [error, onError]);

  return null;
}

function getStringProperty(value: unknown, key: string): string | null {
  if (typeof value !== "object" || value === null || !(key in value)) return null;
  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" && property.length > 0 ? property : null;
}

function getResponseError(value: unknown, fallback: string): string {
  return getStringProperty(value, "error") ?? fallback;
}

function DesignRunSubscription({
  runId,
  publicAccessToken,
  onComplete,
  onError,
}: {
  runId: string;
  publicAccessToken: string;
  onComplete: (summary: string | null, errorMessage: string | null) => void;
  onError: (error: Error) => void;
}) {
  const completionHandled = useRef(false);
  const handleComplete = useCallback(
    (run: RealtimeRun<typeof designAgent>, error?: Error) => {
      if (completionHandled.current) return;
      completionHandled.current = true;
      onComplete(
        run.isSuccess ? run.output?.summary ?? "Design update completed." : null,
        error?.message ?? run.error?.message ?? null
      );
    },
    [onComplete]
  );
  const { error } = useRealtimeRun<typeof designAgent>(runId, {
    accessToken: publicAccessToken,
    skipColumns: ["payload"],
    onComplete: handleComplete,
  });

  useEffect(() => {
    if (error && !completionHandled.current) {
      completionHandled.current = true;
      onError(error);
    }
  }, [error, onError]);

  return null;
}
