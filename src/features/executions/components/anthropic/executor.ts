import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import * as Handlebars from "handlebars";
import { anthropicChannel } from "@/inngest/channels/anthropic";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { type AnthropicNodeData } from "./types";
import prisma from "@/lib/prisma";
import { CredentialType } from "@/generated/prisma/enums";
import { decrypt } from "@/lib/encryption";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);
  return safeString;
});

export const anthropicExecutor: NodeExecutor<AnthropicNodeData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  // Publish "loading" state for Anthropic
  await publish(
    anthropicChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName || data.variableName.trim() === "") {
    await publish(
      anthropicChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError(
      "Anthropic node: Variable name is required. Please configure the node with a valid variable name.",
    );
  }

  if (!data.userPrompt || data.userPrompt.trim() === "") {
    await publish(
      anthropicChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Anthropic node: User prompt is required");
  }

  if (!data.credentialId) {
    await publish(
      anthropicChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Anthropic node: Credential is required");
  }

  // Fetch credential from database
  const credential = await step.run("fetch-anthropic-credential", async () => {
    const credentialRecord = await prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        type: CredentialType.ANTHROPIC,
        userId,
      },
    });

    if (!credentialRecord) {
      throw new NonRetriableError("Anthropic node: Credential not found");
    }

    if (!credentialRecord.value) {
      throw new NonRetriableError(
        "Anthropic node: Credential value is missing",
      );
    }

    return credentialRecord.value;
  });

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";

  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const anthropic = createAnthropic({
    apiKey: decrypt(credential),
  });

  try {
    const { steps } = await step.ai.wrap(
      "anthropic-generate-text",
      generateText,
      {
        model: anthropic("claude-3-5-sonnet-20241022"), // Use a fixed model since we're now using credentials
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
      anthropicChannel().status({
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
      anthropicChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
