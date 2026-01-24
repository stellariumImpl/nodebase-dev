import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { deepseekChannel } from "@/inngest/channels/deepseek";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { normalizeDeepSeekModel, type DeepSeekNodeData } from "./types";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);
  return safeString;
});

export const deepseekExecutor: NodeExecutor<DeepSeekNodeData> = async ({
  data,
  nodeId,
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

  if (!data.variableName) {
    await publish(
      deepseekChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("DeepSeek node: Variable name is missing");
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

  // TODO: Throw if credential is missing

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";

  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  // TODO: Fetch credential that user selected（这个暂时不要管）
  const credentialValue = process.env.DEEPSEEK_API_KEY!;

  const deepseek = createDeepSeek({
    apiKey: credentialValue,
  });

  try {
    const { steps } = await step.ai.wrap("deepseek-generate-text", generateText, {
      model: deepseek(normalizeDeepSeekModel(data.model)),
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