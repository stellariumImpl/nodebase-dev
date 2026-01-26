import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import * as Handlebars from "handlebars";
import { deepseekChannel } from "@/inngest/channels/deepseek";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { type DeepSeekNodeData } from "./types";
import prisma from "@/lib/prisma";
import { CredentialType } from "@/generated/prisma/enums";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);
  return safeString;
});

export const deepseekExecutor: NodeExecutor<DeepSeekNodeData> = async ({
  data,
  nodeId,
  userId,
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

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";

  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const deepseek = createDeepSeek({
    apiKey: credential,
  });

  try {
    const { steps } = await step.ai.wrap(
      "deepseek-generate-text",
      generateText,
      {
        model: deepseek("deepseek-chat"), // Use a fixed model since we're now using credentials
        system: systemPrompt,
        prompt: userPrompt,
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      },
    );
    const text =
      steps[0].content[0].type === "text" ? steps[0].content[0].text : "";

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
