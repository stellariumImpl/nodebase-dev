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
      
      // Check if trying to add a manual trigger when one already exists
      if (selection.type === NodeType.MANUAL_TRIGGER) {
        const hasManualTrigger = nodes.some(
          (node) => node.type === NodeType.MANUAL_TRIGGER,
        );

        if (hasManualTrigger) {
          toast.error("Only one manual trigger is allowed per workflow");
          return;
        }
      }

      // Check if trying to add a chat trigger when one already exists
      if (selection.type === NodeType.CHAT_TRIGGER) {
        const hasChatTrigger = nodes.some(
          (node) => node.type === NodeType.CHAT_TRIGGER,
        );

        if (hasChatTrigger) {
          toast.error("Only one chat trigger is allowed per workflow");
          return;
        }
      }

      // Check if trying to add a Google Form trigger when one already exists
      if (selection.type === NodeType.GOOGLE_FORM_TRIGGER) {
        const hasGoogleFormTrigger = nodes.some(
          (node) => node.type === NodeType.GOOGLE_FORM_TRIGGER,
        );

        if (hasGoogleFormTrigger) {
          toast.error("Only one Google Form trigger is allowed per workflow");
          return;
        }
      }

      // Check if trying to add a Stripe Event trigger when one already exists
      if (selection.type === NodeType.STRIPE_TRIGGER) {
        const hasStripeTrigger = nodes.some(
          (node) => node.type === NodeType.STRIPE_TRIGGER,
        );

        if (hasStripeTrigger) {
          toast.error("Only one Stripe Event trigger is allowed per workflow");
          return;
        }
      }

      // IMPORTANT: If adding manual trigger, remove all other triggers
      if (selection.type === NodeType.MANUAL_TRIGGER) {
        const hasOtherTriggers = nodes.some(
          (node) => 
            node.type === NodeType.CHAT_TRIGGER ||
            node.type === NodeType.GOOGLE_FORM_TRIGGER ||
            node.type === NodeType.STRIPE_TRIGGER
        );

        if (hasOtherTriggers) {
          toast.error("Manual trigger cannot coexist with other triggers. Removing existing triggers.");
          // Remove all other triggers and keep only manual trigger
          setNodes((nodes) => {
            const filteredNodes = nodes.filter(
              (node) => 
                node.type !== NodeType.CHAT_TRIGGER &&
                node.type !== NodeType.GOOGLE_FORM_TRIGGER &&
                node.type !== NodeType.STRIPE_TRIGGER
            );
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const flowPosition = screenToFlowPosition({
              x: centerX + (Math.random() - 0.5) * 200,
              y: centerY + (Math.random() - 0.5) * 200,
            });

            const manualTriggerNode = {
              id: createId(),
              data: {},
              position: flowPosition,
              type: NodeType.MANUAL_TRIGGER,
            };

            return [manualTriggerNode, ...filteredNodes];
          });
          onOpenChange(false);
          return;
        }
      }

      // If adding any other trigger, check if manual trigger exists
      if (
        selection.type === NodeType.CHAT_TRIGGER ||
        selection.type === NodeType.GOOGLE_FORM_TRIGGER ||
        selection.type === NodeType.STRIPE_TRIGGER
      ) {
        const hasManualTrigger = nodes.some(
          (node) => node.type === NodeType.MANUAL_TRIGGER,
        );

        if (hasManualTrigger) {
          toast.error("Cannot add this trigger because manual trigger already exists");
          return;
        }
      }

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
