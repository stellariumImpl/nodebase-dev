import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import * as Handlebars from "handlebars";
import { geminiChannel } from "@/inngest/channels/gemini";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { type GeminiNodeData } from "./types";
import prisma from "@/lib/prisma";
import { CredentialType } from "@/generated/prisma/enums";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);
  return safeString;
});

export const geminiExecutor: NodeExecutor<GeminiNodeData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  // Publish "loading" state for Http Request
  await publish(
    geminiChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Geminin node: Variable name is missing");
  }

  if (!data.userPrompt) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Geminin node: User prompt is missing");
  }

  if (!data.credentialId) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Gemini node: Credential is required");
  }

  // Fetch credential from database
  const credential = await step.run("fetch-gemini-credential", async () => {
    const credentialRecord = await prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        type: CredentialType.GEMINI,
      },
    });

    if (!credentialRecord) {
      throw new NonRetriableError("Gemini node: Credential not found");
    }

    if (!credentialRecord.value) {
      throw new NonRetriableError("Gemini node: Credential value is missing");
    }

    return credentialRecord.value;
  });

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";

  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const google = createGoogleGenerativeAI({
    apiKey: credential,
  });

  try {
    const { steps } = await step.ai.wrap("gemini-generate-text", generateText, {
      model: google("gemini-2.0-flash"),
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
      geminiChannel().status({
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
      geminiChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
