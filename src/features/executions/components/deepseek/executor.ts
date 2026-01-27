import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import * as Handlebars from "handlebars";
import { deepseekChannel } from "@/inngest/channels/deepseek";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { type DeepSeekNodeData } from "./types";
import prisma from "@/lib/prisma";
import { CredentialType } from "@/generated/prisma/enums";
import { decrypt } from "@/lib/encryption";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);
  return safeString;
});

export const deepseekExecutor: NodeExecutor<DeepSeekNodeData> = async ({
  data,
  nodeId,
  userId,
  workflowId,
  context,
  step,
  publish,
}) => {
  // Publish "loading" state for Http Request
  await publish(
    deepseekChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName || data.variableName.trim() === "") {
    await publish(
      deepseekChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError(
      "DeepSeek node: Variable name is required. Please configure the node with a valid variable name.",
    );
  }

  if (!data.userPrompt) {
    await publish(
      deepseekChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("DeepSeek node: User prompt is missing");
  }

  if (!data.credentialId) {
    await publish(
      deepseekChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("DeepSeek node: Credential is required");
  }

  // 获取最近的对话历史，待定 10条
  const historyMessages = await step.run("fetch-chat-history", async () => {
    return prisma.chatMessage.findMany({
      where: { workflowId },
      orderBy: { createdAt: "asc" },
      take: 10, // 先去取10条，防止token爆炸
    });
  });

  // 讲历史记录转化为AI SDK要求的格式
  const messages = [
    {
      role: "system",
      content: data.systemPrompt
        ? Handlebars.compile(data.systemPrompt)(context)
        : "You are a helpful assistant.",
    },
    ...historyMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user",
      content: Handlebars.compile(data.userPrompt)(context),
    },
  ];

  // Fetch credential from database
  const credential = await step.run("fetch-deepseek-credential", async () => {
    const credentialRecord = await prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        type: CredentialType.DEEPSEEK,
        userId,
      },
    });

    if (!credentialRecord) {
      throw new NonRetriableError("DeepSeek node: Credential not found");
    }

    if (!credentialRecord.value) {
      throw new NonRetriableError("DeepSeek node: Credential value is missing");
    }

    return credentialRecord.value;
  });

  // const systemPrompt = data.systemPrompt
  //   ? Handlebars.compile(data.systemPrompt)(context)
  //   : "You are a helpful assistant.";

  // const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const deepseek = createDeepSeek({
    apiKey: decrypt(credential),
  });

  try {
    const { steps } = await step.ai.wrap(
      "deepseek-generate-text",
      generateText,
      {
        model: deepseek("deepseek-chat"), // Use a fixed model since we're now using credentials
        messages: messages as any, // AI SDK 会自动处理
        // system: systemPrompt,
        // prompt: userPrompt,
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      },
    );

    const text =
      steps[0].content[0].type === "text" ? steps[0].content[0].text : "";

    // 将 AI 的回复存入数据库，形成闭环
    // 只有存进去了，下一次对话才会有记忆
    await step.run("save-ai-response", async () => {
      return prisma.chatMessage.create({
        data: {
          workflowId,
          role: "assistant",
          content: text,
        },
      });
    });

    await publish(
      deepseekChannel().status({
        nodeId,
        status: "success",
      }),
    );

    return {
      ...context,
      [data.variableName]: {
        aiResponse: text,
      },
    };
  } catch (error) {
    await publish(
      deepseekChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
