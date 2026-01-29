import type { NodeExecutor } from "@/features/executions/types";

type ManualTriggerData = Record<string, unknown>;

export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
  context,
  step,
}) => {
  // Check if this is the active trigger for this execution
  const isActiveTrigger = context.trigger?.type === "manual";

  if (!isActiveTrigger) {
    // Skip execution if this is not the active trigger
    return context;
  }

  const result = await step.run("manual-trigger", async () => context);

  return result;
};
