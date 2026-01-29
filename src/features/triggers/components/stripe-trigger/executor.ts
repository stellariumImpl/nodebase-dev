import type { NodeExecutor } from "@/features/executions/types";
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger";

type StripeTriggerData = Record<string, unknown>;

export const StripeTriggerExecutor: NodeExecutor<StripeTriggerData> = async ({
  nodeId,
  context,
  step,
  publish,
  workflowId,
}) => {
  // Check if this is the active trigger for this execution
  const isActiveTrigger = context.trigger?.type === "stripe";

  if (!isActiveTrigger) {
    // Skip execution if this is not the active trigger
    return context;
  }

  await publish(
    stripeTriggerChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  const result = await step.run("stripe-trigger", async () => context);

  await publish(
    stripeTriggerChannel().status({
      nodeId,
      status: "success",
    }),
  );

  return result;
};
