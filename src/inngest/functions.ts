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

/**
 * 1. 专门处理 AI 对话的函数
 * 监听 chat/message.sent 事件
 */
export const handleChatMessage = inngest.createFunction(
  { id: "handle-chat-message" },
  { event: "chat/message.sent" }, // 独立事件，不触发工作流执行
  async ({ event, step }) => {
    const { workflowId, userId, message } = event.data;

    // A. 存入用户消息
    await step.run("save-user-message", async () => {
      return prisma.chatMessage.create({
        data: { workflowId, role: "user", content: message },
      });
    });

    // B. 上下文感知：读取当前工作流的结构（节点和连线）
    const workflowContext = await step.run("get-workflow-context", async () => {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { nodes: true, connections: true },
      });
      if (!workflow) return "未知工作流";

      // 将节点信息转为简单的文本描述，喂给 AI
      const nodeInfo = workflow.nodes
        .map((n) => `- ${n.name} (类型: ${n.type})`)
        .join("\n");
      const connectionInfo = workflow.connections
        .map((c) => `- 从 ${c.fromNodeId} 连向 ${c.toNodeId}`)
        .join("\n");
      return `当前画布结构：\n节点：\n${nodeInfo}\n连接：\n${connectionInfo}`;
    });

    // C. 调用 DeepSeek (此处建议封装一个工具函数)
    const aiReply = await step.run("call-deepseek", async () => {
      // 这里的逻辑可以根据你的具体 DeepSeek 配置实现
      // 核心是将 workflowContext 作为系统提示词发给 LLM
      const prompt = `你是一个工作流专家。${workflowContext}\n用户问：${message}`;
      // const res = await fetchDeepSeek(prompt);
      return `收到！我看到你现在有 ${workflowContext.split("\n").length} 个节点，建议... (模拟回复)`;
    });

    // D. 存入 AI 回复气泡
    await step.run("save-ai-message", async () => {
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

    // 如果是对话触发，保存用户的原始消息
    // 假设前端发送事件时，将用户输入的文本放在 initialData.message 中
    // if (event.data.initialData?.message) {
    //   await step.run("save-user-message", async () => {
    //     return prisma.chatMessage.create({
    //       data: {
    //         workflowId,
    //         role: "user",
    //         content: event.data.initialData.message as string,
    //       },
    //     });
    //   });
    // }

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
