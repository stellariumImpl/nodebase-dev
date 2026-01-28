"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";

import { inngest } from "@/inngest/client";
import { chatTriggerChannel } from "@/inngest/channels/chat-trigger";

export type ChatTriggerToken = Realtime.Token<
  typeof chatTriggerChannel,
  ["status"]
>;

export async function fetchChatTriggerRealtimeToken(): Promise<ChatTriggerToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: chatTriggerChannel(),
    topics: ["status"],
  });

  return token;
}