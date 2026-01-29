"use client";

import { createId } from "@paralleldrive/cuid2";
import { useReactFlow } from "@xyflow/react";
import {
  GlobeIcon,
  MessageSquareIcon,
  MousePointerIcon,
  WebhookIcon,
} from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NodeType } from "@/generated/prisma/enums"; // NOTE: not sure
import { Separator } from "./ui/separator";

export type NodeTypeOption = {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
};

const triggerNodes: NodeTypeOption[] = [
  {
    type: NodeType.MANUAL_TRIGGER,
    label: "Manual trigger",
    description:
      "Starts the workflow when you click “Execute workflow”. Great for testing.",
    icon: MousePointerIcon,
  },
  {
    type: NodeType.GOOGLE_FORM_TRIGGER,
    label: "Google Form",
    description: "Runs the flow when a Google Form is submitted.",
    icon: "/logos/googleform.svg",
  },
  {
    type: NodeType.STRIPE_TRIGGER,
    label: "Stripe Event",
    description: "Runs the flow when a Stripe Event is captured.",
    icon: "/logos/stripe.svg",
  },
  {
    type: NodeType.CHAT_TRIGGER,
    label: "Chat Trigger",
    description: "Runs the flow when a message is sent in chat.",
    icon: MessageSquareIcon,
  },
];

const executionNodes: NodeTypeOption[] = [
  {
    type: NodeType.HTTP_REQUEST,
    label: "HTTP request (call an API)",
    description: "Send a GET/POST/etc. to an endpoint and use the response.",
    icon: GlobeIcon,
  },
  {
    type: NodeType.GEMINI,
    label: "Gemini",
    description: "Uses Google Gemini to generate text",
    icon: "/logos/gemini.svg",
  },
  {
    type: NodeType.DEEPSEEK,
    label: "DeepSeek",
    description: "Uses DeepSeek for advanced text generation",
    icon: "/logos/deepseek.svg",
  },
  {
    type: NodeType.OPENAI,
    label: "OpenAI",
    description: "Uses OpenAI for advanced text generation",
    icon: "/logos/openai.svg",
  },
  {
    type: NodeType.ANTHROPIC,
    label: "Anthropic",
    description: "Uses Anthropic for advanced text generation",
    icon: "/logos/anthropic.svg",
  },
  {
    type: NodeType.DISCORD,
    label: "Discord",
    description: "Send messages to Discord",
    icon: "/logos/discord.svg",
  },
  {
    type: NodeType.SLACK,
    label: "Slack",
    description: "Send messages to Slack",
    icon: "/logos/slack.svg",
  },
];

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function NodeSelector({
  open,
  onOpenChange,
  children,
}: NodeSelectorProps) {
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();

  const handleNodeSelect = useCallback(
    (selection: NodeTypeOption) => {
      const nodes = getNodes();

      // ---- 1) 定义：哪些算 trigger ----
      const TRIGGER_TYPES = new Set<NodeType>([
        NodeType.MANUAL_TRIGGER,
        NodeType.CHAT_TRIGGER,
        NodeType.GOOGLE_FORM_TRIGGER,
        NodeType.STRIPE_TRIGGER,
        // 如果未来还有更多 trigger，在这里补进去即可
      ]);

      const isTrigger = (t: NodeType) => TRIGGER_TYPES.has(t);
      const isManualTrigger = (t: NodeType) => t === NodeType.MANUAL_TRIGGER;
      const isNonManualTrigger = (t: NodeType) =>
        isTrigger(t) && !isManualTrigger(t);

      const hasManual = nodes.some((n) => n.type === NodeType.MANUAL_TRIGGER);
      const hasAnyNonManualTrigger = nodes.some((n) =>
        isNonManualTrigger(n.type as NodeType),
      );

      // ---- 2) 互斥规则：manual <-> 非manual ----
      // 2.1 想加 manual：只要已有任意非manual trigger，就禁止
      if (
        selection.type === NodeType.MANUAL_TRIGGER &&
        hasAnyNonManualTrigger
      ) {
        toast.error(
          "Manual trigger cannot coexist with other triggers. Remove other triggers first.",
        );
        return;
      }

      // 2.2 想加非manual trigger：只要已有 manual，就禁止
      if (isNonManualTrigger(selection.type) && hasManual) {
        toast.error(
          "Cannot add this trigger because manual trigger already exists. Remove manual trigger first.",
        );
        return;
      }

      // ---- 3) 你原本的“同类型 trigger 只能一个”规则（保留）----
      if (isTrigger(selection.type)) {
        const alreadyHasSameType = nodes.some(
          (node) => node.type === selection.type,
        );
        if (alreadyHasSameType) {
          toast.error("Only one of this trigger type is allowed per workflow");
          return;
        }
      }

      // ---- 4) 原有添加节点逻辑保持不变 ----
      setNodes((nodes) => {
        const hasInitialTrigger = nodes.some(
          (node) => node.type === NodeType.INITIAL,
        );

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const flowPosition = screenToFlowPosition({
          x: centerX + (Math.random() - 0.5) * 200,
          y: centerY + (Math.random() - 0.5) * 200,
        });

        const newNode = {
          id: createId(),
          data: {},
          position: flowPosition,
          type: selection.type,
        };

        if (hasInitialTrigger) {
          return [newNode];
        }

        return [...nodes, newNode];
      });

      onOpenChange(false);
    },
    [setNodes, getNodes, onOpenChange, screenToFlowPosition],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>What triggers this workflow?</SheetTitle>
          <SheetDescription>
            A trigger is a step that starts your workflow.
          </SheetDescription>
        </SheetHeader>
        <div>
          {triggerNodes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <div
                key={nodeType.type}
                className="w-full justify-start h-auto py-5 px-4 rounded-none cursor-pointer border-l-2 border-transparent hover:border-l-primary"
                onClick={() => handleNodeSelect(nodeType)}
              >
                <div className="flex items-center gap-6 w-full overflow-hidden">
                  {typeof Icon === "string" ? (
                    <img
                      src={Icon}
                      alt={nodeType.label}
                      className="size-5 object-contain rounded-sm"
                    />
                  ) : (
                    <Icon className="size-5" />
                  )}
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium text-sm ">
                      {nodeType.label}
                    </span>
                    <span className="text-xs text-muted-foreground max-w-[300px] wrap-break-word">
                      {nodeType.description}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        <div>
          {executionNodes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <div
                key={nodeType.type}
                className="w-full justify-start h-auto py-5 px-4 rounded-none cursor-pointer border-l-2 border-transparent hover:border-l-primary"
                onClick={() => handleNodeSelect(nodeType)}
              >
                <div className="flex items-center gap-6 w-full overflow-hidden">
                  {typeof Icon === "string" ? (
                    <img
                      src={Icon}
                      alt={nodeType.label}
                      className="size-5 object-contain rounded-sm"
                    />
                  ) : (
                    <Icon className="size-5" />
                  )}
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium text-sm ">
                      {nodeType.label}
                    </span>
                    <span className="text-xs text-muted-foreground max-w-[300px] wrap-break-word">
                      {nodeType.description}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
