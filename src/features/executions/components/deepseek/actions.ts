"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";

import { deepseekChannel } from "@/inngest/channels/deepseek";

import { inngest } from "@/inngest/client";

export type DeepSeekToken = Realtime.Token<typeof deepseekChannel, ["status"]>;

export async function fetchDeepSeekRealtimeToken(): Promise<DeepSeekToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: deepseekChannel(),
    topics: ["status"],
  });

  return token;
}