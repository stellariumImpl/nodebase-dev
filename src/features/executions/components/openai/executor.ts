import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { openaiChannel } from "@/inngest/channels/openai";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { normalizeOpenAIModel, type OpenAINodeData } from "./types";

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

  // Provide default values if missing
  const variableName = data.variableName || "myAIcall";
  const userPrompt = data.userPrompt || "Please provide a prompt";

  if (!userPrompt.trim()) {
    await publish(
      openaiChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("OpenAI node: User prompt is required");
  }

  // TODO: Throw if credential is missing

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";

  const compiledUserPrompt = Handlebars.compile(userPrompt)(context);

  // TODO: Fetch credential that user selected（这个暂时不要管）
  const credentialValue = process.env.OPENAI_API_KEY!;

  const openai = createOpenAI({
    apiKey: credentialValue,
  });

  try {
    const { steps } = await step.ai.wrap("openai-generate-text", generateText, {
      model: openai(normalizeOpenAIModel(data.model)),
      system: systemPrompt,
      prompt: compiledUserPrompt,
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
      [variableName]: {
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
