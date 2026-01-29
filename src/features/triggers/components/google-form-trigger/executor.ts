import type { NodeExecutor } from "@/features/executions/types";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";

type GoogleFormTriggerData = Record<string, unknown>;

export const GoogleFormTriggerExecutor: NodeExecutor<
  GoogleFormTriggerData
> = async ({ nodeId, context, step, publish, workflowId }) => {
  // Check if this is the active trigger for this execution
  const isActiveTrigger = context.trigger?.type === "google-form";
  
  if (!isActiveTrigger) {
    // Skip execution if this is not the active trigger
    return context;
  }

  const result = await step.run("google-form-trigger", async () => context);

  return result;
};
