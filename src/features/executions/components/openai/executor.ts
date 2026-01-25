import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import * as Handlebars from "handlebars";
import { openaiChannel } from "@/inngest/channels/openai";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { type OpenAINodeData } from "./types";
import prisma from "@/lib/prisma";
import { CredentialType } from "@/generated/prisma/enums";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);
  return safeString;
});

export const openaiExecutor: NodeExecutor<OpenAINodeData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  // Publish "loading" state for OpenAI
  await publish(
    openaiChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName || data.variableName.trim() === "") {
    await publish(
      openaiChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("OpenAI node: Variable name is required. Please configure the node with a valid variable name.");
  }

  if (!data.userPrompt || data.userPrompt.trim() === "") {
    await publish(
      openaiChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("OpenAI node: User prompt is required");
  }

  if (!data.credentialId) {
    await publish(
      openaiChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("OpenAI node: Credential is required");
  }

  // Fetch credential from database
  const credential = await step.run("fetch-openai-credential", async () => {
    const credentialRecord = await prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        type: CredentialType.OPENAI,
      },
    });

    if (!credentialRecord) {
      throw new NonRetriableError("OpenAI node: Credential not found");
    }

    if (!credentialRecord.value) {
      throw new NonRetriableError("OpenAI node: Credential value is missing");
    }

    return credentialRecord.value;
  });

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";

  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const openai = createOpenAI({
    apiKey: credential,
  });

  try {
    const { steps } = await step.ai.wrap("openai-generate-text", generateText, {
      model: openai("gpt-4o"), // Use a fixed model since we're now using credentials
      system: systemPrompt,
      prompt: userPrompt,
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    });
    const text =
      steps[0].content[0].type === "text" ? steps[0].content[0].text : "";

    await publish(
      openaiChannel().status({
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
      openaiChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
