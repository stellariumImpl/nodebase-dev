import type { NodeExecutor } from "@/features/executions/types";
import { chatTriggerChannel } from "@/inngest/channels/chat-trigger";

type ChatTriggerData = Record<string, unknown>;

/**
 * Chat Trigger 执行器
 * 职责：将初始消息注入工作流上下文
 */
export const chatTriggerExecutor: NodeExecutor<ChatTriggerData> = async ({
  nodeId,
  context,
  step,
  publish,
  workflowId,
}) => {
  // Check if this is the active trigger for this execution
  const isActiveTrigger = context.trigger?.type === "chat";
  
  if (!isActiveTrigger) {
    // Skip execution if this is not the active trigger
    return context;
  }

  await publish(
    chatTriggerChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  const result = await step.run("chat-trigger", async () => context);

  await publish(
    chatTriggerChannel().status({
      nodeId,
      status: "success",
    }),
  );

  return result;
};
