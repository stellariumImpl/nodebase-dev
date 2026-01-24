import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { anthropicChannel } from "@/inngest/channels/anthropic";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { normalizeAnthropicModel, type AnthropicNodeData } from "./types";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);
  return safeString;
});

export const anthropicExecutor: NodeExecutor<AnthropicNodeData> = async ({
  data,
  nodeId,
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

  // Provide default values if missing
  const variableName = data.variableName || "myAIcall";
  const userPrompt = data.userPrompt || "Please provide a prompt";
  
  if (!userPrompt.trim()) {
    await publish(
      anthropicChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Anthropic node: User prompt is required");
  }

  // TODO: Throw if credential is missing

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";

  const compiledUserPrompt = Handlebars.compile(userPrompt)(context);

  // TODO: Fetch credential that user selected（这个暂时不要管）
  const credentialValue = process.env.ANTHROPIC_API_KEY!;

  const anthropic = createAnthropic({
    apiKey: credentialValue,
  });

  try {
    const { steps } = await step.ai.wrap("anthropic-generate-text", generateText, {
      model: anthropic(normalizeAnthropicModel(data.model)),
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
      anthropicChannel().status({
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
      anthropicChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};