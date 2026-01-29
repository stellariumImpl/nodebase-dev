import { channel, topic } from "@inngest/realtime";

export const CHAT_TRIGGER_CHANNEL_NAME = "chat-trigger-execution";

export const chatTriggerChannel = channel(
  CHAT_TRIGGER_CHANNEL_NAME,
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);