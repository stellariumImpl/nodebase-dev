import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import * as Handlebars from "handlebars";
import { slackChannel } from "@/inngest/channels/slack";
import { type SlackNodeData } from "./types";
import { decode } from "html-entities";
import ky from "ky";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);
  return safeString;
});

export const slackExecutor: NodeExecutor<SlackNodeData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  // Publish "loading" state for Slack Request
  await publish(
    slackChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.content) {
    await publish(
      slackChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Slack node: Message content is required");
  }

  const rawContent = Handlebars.compile(data.content)(context);
  const content = decode(rawContent);

  const username = data.username
    ? decode(Handlebars.compile(data.username)(context))
    : undefined;

  try {
    const result = await step.run("slack-webhook", async () => {
      if (!data.webhookUrl) {
        await publish(
          slackChannel().status({
            nodeId,
            status: "error",
          }),
        );
        throw new NonRetriableError("Slack node: Webhook URL is required");
      }

      if (!data.variableName) {
        await publish(
          slackChannel().status({
            nodeId,
            status: "error",
          }),
        );
        throw new NonRetriableError("Slack node: Variable name is missing");
      }

      // Check if it's a standard Slack webhook or a workflow trigger
      const isWorkflowTrigger = data.webhookUrl.includes("/triggers/");

      if (isWorkflowTrigger) {
        // For Slack workflow triggers - use flat JSON structure
        await ky.post(data.webhookUrl, {
          json: {
            content: content,
          },
        });
      } else {
        // For standard Slack incoming webhooks
        await ky.post(data.webhookUrl, {
          json: {
            text: content,
            username,
          },
        });
      }

      return {
        ...context,
        [data.variableName]: {
          messageContent: content,
        },
      };
    });
    await publish(
      slackChannel().status({
        nodeId,
        status: "success",
      }),
    );

    return result;
  } catch (error) {
    await publish(
      slackChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
