import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/prisma";
import { topologicalSort } from "./utils";
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

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { decrypt } from "@/lib/encryption";
import { CredentialType } from "@/generated/prisma/enums";

// 代码层维护官方服务地址，不改数据库
const OFFICIAL_URL_MAP: Record<string, string> = {
  DEEPSEEK: "https://api.deepseek.com/v1",
  OPENAI: "https://api.openai.com/v1",
};

/**
 * 专门处理 AI 对话的函数
 * 监听由 WorkflowsRouter 发出的 chat/message.sent 事件
 */
export const handleChatMessage = inngest.createFunction(
  { id: "handle-chat-message" },
  { event: "chat/message.sent" },
  async ({ event, step }) => {
    const { workflowId, userId, message, aiConfig } = event.data;

    // 1. 混合解析 AI 配置：支持现有凭证解密与手动自定义 URL
    const resolvedConfig = await step.run("resolve-ai-config", async () => {
      // 场景 A：用户手动输入了自定义/本地 URL (如 Ollama)
      if (aiConfig?.customBaseUrl) {
        return {
          baseURL: aiConfig.customBaseUrl,
          apiKey: aiConfig.customApiKey || "ollama", // Ollama 默认通常不需要有效 Key
        };
      }

      // 场景 B：用户选择了现有凭证
      if (aiConfig?.credentialId) {
        const credential = await prisma.credential.findUniqueOrThrow({
          where: { id: aiConfig.credentialId, userId },
        });

        // 严格使用你的加密体系进行解密
        const apiKey = decrypt(credential.value);
        // 根据凭证类型映射官方 URL
        const baseURL =
          OFFICIAL_URL_MAP[credential.type] ||
          OFFICIAL_URL_MAP[CredentialType.OPENAI];

        return { baseURL, apiKey };
      }

      // 场景 C：回退到系统环境变量 (作为保底方案)
      return {
        baseURL:
          process.env.DEEPSEEK_API_URL ||
          OFFICIAL_URL_MAP[CredentialType.DEEPSEEK],
        apiKey: process.env.DEEPSEEK_API_KEY as string,
      };
    });

    // 2. 存入用户消息到数据库，以便前端轮询展示
    await step.run("save-user-message", async () => {
      return prisma.chatMessage.create({
        data: { workflowId, role: "user", content: message },
      });
    });

    // 3. 上下文感知：读取当前画布的节点与连线结构
    const workflowContext = await step.run("get-workflow-context", async () => {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { nodes: true, connections: true },
      });
      if (!workflow) return "当前是一个空工作流。";

      const nodeInfo = workflow.nodes
        .map((n) => `- ${n.name} (类型: ${n.type})`)
        .join("\n");
      const connectionInfo = workflow.connections
        .map((c) => `- 从节点 [${c.fromNodeId}] 指向节点 [${c.toNodeId}]`)
        .join("\n");

      return `【画布结构分析】\n现有节点：\n${nodeInfo}\n\n连线逻辑：\n${connectionInfo}`;
    });

    // 4. 调用 Vercel AI SDK 生成回复 (DeepSeek 兼容 OpenAI 协议)
    const aiReply = await step.run("call-ai", async () => {
      const provider = createOpenAI({
        apiKey: resolvedConfig.apiKey,
        baseURL: resolvedConfig.baseURL,
      });

      const { text } = await generateText({
        model: provider("deepseek-chat"), // 兼容大部分 OpenAI 协议供应商
        system: `你是一个专业的 Nodebase 工作流诊断专家。你会分析用户的画布结构并给出逻辑建议。不要胡乱猜测，基于以下事实回答：\n${workflowContext}`,
        prompt: message,
      });

      return text;
    });

    // 5. 将 AI 的回复存入数据库
    await step.run("save-assistant-message", async () => {
      return prisma.chatMessage.create({
        data: { workflowId, role: "assistant", content: aiReply },
      });
    });

    return { success: true };
  },
);

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0,
    onFailure: async ({ event, step, publish }) => {
      const updatedExecution = await prisma.execution.update({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });

      return updatedExecution;
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
    ],
  },
  async ({ event, step, publish }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId;
    const executionId = event.data.executionId || event.id;

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError(
        "Event ID or Workflow ID is missing, so non retry",
      );
    }

    // 创建执行记录
    await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId,
        },
      });
    });

    // Publish workflow reset event to notify frontend to clear all node statuses
    await publish(
      workflowResetChannel().reset({
        workflowId,
        executionId,
      }),
    );

    // 准备工作流
    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return topologicalSort(workflow.nodes, workflow.connections);
    });

    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        select: {
          userId: true,
        },
      });
      return workflow.userId;
    });

    // 初始化上下文
    // Initialize the context with any initial data from the trigger
    let context = event.data.initialData || {};

    // Execute each node
    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        context,
        step,
        publish,
        userId,
        workflowId,
      });
    }

    // 更新执行成功状态
    await step.run("update-execution", async () => {
      const updatedExecution = await prisma.execution.update({
        where: { inngestEventId, workflowId },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: context,
        },
      });

      return updatedExecution;
    });

    return {
      workflowId,
      result: context,
    };
  },
);
