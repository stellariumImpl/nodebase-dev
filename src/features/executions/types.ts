import type { Realtime } from "@inngest/realtime";
import type { GetStepTools, Inngest } from "inngest";

export interface TriggerData {
  type: "manual" | "chat" | "google-form" | "stripe";
  source: string;
  workflowId: string;
  userId: string;
  message?: string;
}

export interface WorkflowContext {
  trigger?: TriggerData;
  [key: string]: unknown;
}

export type StepTools = GetStepTools<Inngest.Any>;

export interface NodeExecutorParams<TData = Record<string, unknown>> {
  data: TData;
  nodeId: string;
  userId: string;
  workflowId: string; // 让executor知道当前工作流的ID
  context: WorkflowContext;
  step: StepTools;
  publish: Realtime.PublishFn;
}

export type NodeExecutor<TData = Record<string, unknown>> = (
  params: NodeExecutorParams<TData>,
) => Promise<WorkflowContext>;
