import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/prisma";
import {
  topologicalSort,
  type SortableNode,
  type SortableConnection,
} from "./utils";
import { ExecutionStatus, NodeType } from "@/generated/prisma/enums";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual_trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { geminiChannel } from "./channels/gemini";
import { workflowResetChannel } from "./channels/workflow-reset";
import { discordChannel } from "./channels/discord";
import { slackChannel } from "./channels/slack";

import { CredentialType } from "@/generated/prisma/enums";

import { chatTriggerChannel } from "./channels/chat-trigger";

const OFFICIAL_URL_MAP: Partial<Record<CredentialType, string>> = {
  [CredentialType.DEEPSEEK]: "https://api.deepseek.com",
  [CredentialType.OPENAI]: "https://api.openai.com/v1",
};

const OFFICIAL_MODEL_MAP: Partial<Record<CredentialType, string>> = {
  [CredentialType.DEEPSEEK]: "deepseek-chat",
  [CredentialType.OPENAI]: "gpt-4o",
};

type ResolvedAIConfig = {
  baseURL: string;
  apiKey: string;
  modelId: string;
  providerType: CredentialType | "CUSTOM";
};

/**
 * 专门处理 AI 对话的函数
 */
// export const handleChatMessage = inngest.createFunction(
//   { id: "handle-chat-message" },
//   { event: "chat/message.sent" },
//   async ({ event, step }) => {
//     const { workflowId, userId, message, aiConfig } = event.data;

//     // 1. 解析 AI 配置 (不再负责保存用户消息，消息已在 Router 存入)
//     const resolvedConfig: ResolvedAIConfig = await step.run(
//       "resolve-ai-config",
//       async () => {
//         try {
//           if (aiConfig?.customBaseUrl) {
//             return {
//               baseURL: aiConfig.customBaseUrl,
//               apiKey: aiConfig.customApiKey || "ollama",
//               modelId: "llama3.1",
//               providerType: "CUSTOM" as const,
//             };
//           }

//           if (aiConfig?.credentialId) {
//             const credential = await prisma.credential.findUniqueOrThrow({
//               where: { id: aiConfig.credentialId, userId },
//             });
//             return {
//               baseURL:
//                 OFFICIAL_URL_MAP[credential.type] ||
//                 OFFICIAL_URL_MAP[CredentialType.OPENAI]!,
//               apiKey: decrypt(credential.value),
//               modelId: OFFICIAL_MODEL_MAP[credential.type] || "gpt-4o",
//               providerType: credential.type,
//             };
//           }

//           return {
//             baseURL:
//               process.env.DEEPSEEK_API_URL ||
//               OFFICIAL_URL_MAP[CredentialType.DEEPSEEK]!,
//             apiKey: process.env.DEEPSEEK_API_KEY as string,
//             modelId: "deepseek-chat",
//             providerType: CredentialType.DEEPSEEK,
//           };
//         } catch (err: any) {
//           throw new NonRetriableError(`AI 配置错误: ${err.message}`);
//         }
//       },
//     );

//     // 2. ✅ 低成本优化：语义化上下文感知 (将 UUID 转换为节点名称)
//     const workflowContext = await step.run("get-workflow-context", async () => {
//       const workflow = await prisma.workflow.findUnique({
//         where: { id: workflowId },
//         include: { nodes: true, connections: true },
//       });
//       if (!workflow || workflow.nodes.length === 0)
//         return "当前是一个空工作流。";

//       const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n.name]));

//       const nodeInfo = workflow.nodes
//         .map((n) => `- ${n.name} (类型: ${n.type})`)
//         .join("\n");

//       const connectionInfo = workflow.connections
//         .map((c) => {
//           const fromName = nodeMap.get(c.fromNodeId) || "未知节点";
//           const toName = nodeMap.get(c.toNodeId) || "未知节点";
//           return `- [${fromName}] --> [${toName}]`;
//         })
//         .join("\n");

//       return `【画布节点】\n${nodeInfo}\n\n【语义化执行链路】\n${connectionInfo || "暂无连线"}`;
//     });

//     // 3. 调用 AI 生成回复
//     const aiReply = await step.run("call-ai", async () => {
//       try {
//         const provider =
//           resolvedConfig.providerType === CredentialType.DEEPSEEK
//             ? createDeepSeek({
//                 apiKey: resolvedConfig.apiKey,
//                 baseURL: resolvedConfig.baseURL,
//               })
//             : createOpenAI({
//                 apiKey: resolvedConfig.apiKey,
//                 baseURL: resolvedConfig.baseURL,
//               });

//         const { text } = await generateText({
//           model: provider(resolvedConfig.modelId),
//           system: `你是一个专业的 Nodebase 诊断专家。请基于以下语义化链路回答，不要胡乱猜测：\n\n${workflowContext}`,
//           prompt: message,
//         });
//         return text;
//       } catch (error: any) {
//         const status = error?.status || 500;
//         if (status === 401 || status === 404) {
//           throw new NonRetriableError(
//             `AI 调用失败 (${status}): ${error.message}`,
//           );
//         }
//         throw error;
//       }
//     });

//     // 4. 将 AI 的回复存入数据库
//     await step.run("save-assistant-message", async () => {
//       return prisma.chatMessage.create({
//         data: { workflowId, role: "assistant", content: aiReply },
//       });
//     });

//     return { success: true };
//   },
// );

export const handleChatMessage = inngest.createFunction(
  { id: "handle-chat-message" },
  { event: "chat/message.sent" },
  async ({ event, step }) => {
    const { workflowId, message, userId, aiConfig } = event.data;

    // 1. Agent 规划
    const analysis = await step.run("agent-plan", async () => {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { nodes: true },
      });

      if (!workflow) return { shouldExecute: false };

      const hasChatTrigger = workflow.nodes.some(
        (n) => n.type === "CHAT_TRIGGER",
      );

      return {
        shouldExecute: hasChatTrigger,
        reason: hasChatTrigger ? "发现对话触发器。" : "未配置对话触发器。",
      };
    });

    // 2. ✅ 修复：使用 sendEvent 并提供 Step ID
    if (analysis.shouldExecute) {
      await step.sendEvent("trigger-workflow-execution", {
        name: "workflow/execute.workflow",
        data: {
          workflowId,
          initialData: {
            message,
            aiConfig,
            trigger: {
              type: "chat",
              source: "chat-panel",
              workflowId,
              userId,
              message,
            },
          },
        },
      });
    }

    // 3. 反馈
    await step.run("save-assistant-reply", async () => {
      await prisma.chatMessage.create({
        data: {
          workflowId,
          role: "assistant",
          content: analysis.shouldExecute
            ? "收到！我已发现画布中的对话触发器，正在自动执行工作流..."
            : "收到消息。但当前画布没有配置对话触发器，我无法自动启动流程。",
        },
      });
    });

    return { success: true };
  },
);

/**
 * ✅ 你的执行器逻辑，完整保留
 */
export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0,
    onFailure: async ({ event }) => {
      await prisma.execution.update({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
  },
  {
    event: "workflow/execute.workflow",
    channels: [
      httpRequestChannel(),
      manualTriggerChannel(),
      googleFormTriggerChannel(),
      stripeTriggerChannel(),
      geminiChannel(),
      workflowResetChannel(),
      discordChannel(),
      slackChannel(),
      chatTriggerChannel(),
    ],
  },
  async ({ event, step, publish }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId;
    const executionId = event.data.executionId || event.id;

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or Workflow ID is missing");
    }

    // 发送工作流重置消息，通知前端重置节点状态
    await publish(
      workflowResetChannel().reset({
        workflowId,
        executionId,
      }),
    );

    await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: { workflowId, inngestEventId },
      });
    });

    const workflowWithNodes = await step.run("prepare-workflow", async () => {
      return prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: { nodes: true, connections: true },
      });
    });

    // Determine the active trigger based on event source
    const eventTriggerType = event.data.initialData?.trigger?.type;
    const activeTriggerNode = workflowWithNodes.nodes.find((node) => {
      if (
        eventTriggerType === "manual" &&
        node.type === NodeType.MANUAL_TRIGGER
      ) {
        return true;
      }
      if (eventTriggerType === "chat" && node.type === NodeType.CHAT_TRIGGER) {
        return true;
      }
      if (
        eventTriggerType === "google-form" &&
        node.type === NodeType.GOOGLE_FORM_TRIGGER
      ) {
        return true;
      }
      if (
        eventTriggerType === "stripe" &&
        node.type === NodeType.STRIPE_TRIGGER
      ) {
        return true;
      }
      return false;
    });

    // If no specific trigger found in event data, use the first trigger node
    const triggerNodes = workflowWithNodes.nodes.filter(
      (node) =>
        node.type === NodeType.MANUAL_TRIGGER ||
        node.type === NodeType.CHAT_TRIGGER ||
        node.type === NodeType.GOOGLE_FORM_TRIGGER ||
        node.type === NodeType.STRIPE_TRIGGER,
    );

    const activeTrigger = activeTriggerNode || triggerNodes[0];

    if (!activeTrigger) {
      throw new NonRetriableError("No valid trigger found in workflow");
    }

    // Publish status update for the active trigger only
    if (activeTrigger.type === NodeType.MANUAL_TRIGGER) {
      await publish(
        manualTriggerChannel().status({
          nodeId: activeTrigger.id,
          status: "loading",
        }),
      );
    } else if (activeTrigger.type === NodeType.CHAT_TRIGGER) {
      await publish(
        chatTriggerChannel().status({
          nodeId: activeTrigger.id,
          status: "loading",
        }),
      );
    } else if (activeTrigger.type === NodeType.GOOGLE_FORM_TRIGGER) {
      await publish(
        googleFormTriggerChannel().status({
          nodeId: activeTrigger.id,
          status: "loading",
        }),
      );
    } else if (activeTrigger.type === NodeType.STRIPE_TRIGGER) {
      await publish(
        stripeTriggerChannel().status({
          nodeId: activeTrigger.id,
          status: "loading",
        }),
      );
    }

    const sortedNodes = topologicalSort(
      workflowWithNodes.nodes,
      workflowWithNodes.connections,
    );

    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        select: { userId: true },
      });
      return workflow.userId;
    });

    let context = event.data.initialData || {};

    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      const previousContext = context;

      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        context,
        step,
        publish,
        userId,
        workflowId,
      });

      // 如果当前节点是 active trigger，并且执行成功，立即更新状态
      if (node.id === activeTrigger.id) {
        if (activeTrigger.type === NodeType.MANUAL_TRIGGER) {
          await publish(
            manualTriggerChannel().status({
              nodeId: activeTrigger.id,
              status: "success",
            }),
          );
        } else if (activeTrigger.type === NodeType.CHAT_TRIGGER) {
          await publish(
            chatTriggerChannel().status({
              nodeId: activeTrigger.id,
              status: "success",
            }),
          );
        } else if (activeTrigger.type === NodeType.GOOGLE_FORM_TRIGGER) {
          await publish(
            googleFormTriggerChannel().status({
              nodeId: activeTrigger.id,
              status: "success",
            }),
          );
        } else if (activeTrigger.type === NodeType.STRIPE_TRIGGER) {
          await publish(
            stripeTriggerChannel().status({
              nodeId: activeTrigger.id,
              status: "success",
            }),
          );
        }
      }
    }

    await step.run("update-execution", async () => {
      await prisma.execution.update({
        where: { inngestEventId, workflowId },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: context,
        },
      });
    });

    return { workflowId, result: context };
  },
);
