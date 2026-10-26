declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
      status: string | null;
    };
    RoomEvent: import("@/types/design-agent").AiDesignStatusEvent;
    FeedMessageData: import("@/types/task").AiChatFeedMessage;
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar?: string;
        color: string;
      };
    };
  }
}

export {};
