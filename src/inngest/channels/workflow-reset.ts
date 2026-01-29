import { channel, topic } from "@inngest/realtime";

export const WORKFLOW_RESET_CHANNEL_NAME = "workflow-reset";

export const workflowResetChannel = channel(
  WORKFLOW_RESET_CHANNEL_NAME,
).addTopic(
  topic("reset").type<{
    workflowId: string;
    executionId: string;
  }>(),
);
