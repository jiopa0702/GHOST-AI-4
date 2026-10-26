export type AiDesignStatus = "started" | "processing" | "complete" | "error";

export type AiDesignStatusEvent = {
  type: "ai-status-feed" | "ai-status";
  runId: string;
  status: AiDesignStatus;
  message: string;
  timestamp: string;
};
