"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { workflowResetChannel } from "@/inngest/channels/workflow-reset";

export type WorkflowResetToken = Realtime.Token<typeof workflowResetChannel, ["reset"]>;

export async function fetchWorkflowResetToken(): Promise<WorkflowResetToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: workflowResetChannel(),
    topics: ["reset"],
  });

  return token;
}