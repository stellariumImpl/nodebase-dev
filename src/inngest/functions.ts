import prisma from "@/lib/prisma";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    // Fetching the video
    await step.sleep("fetching-the-video", "5s");

    // Transcribing the video
    await step.sleep("transcribing-the-video", "5s");

    // Sending transcription to AI
    await step.sleep("sending-transcription-to-ai", "5s");

    await step.run("create-workflow", () => {
      return prisma.workflow.create({
        data: {
          name: "workflow-from-inngest",
        },
      });
    });
  }
);
