"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatTriggerDialog = ({ open, onOpenChange }: Props) => {
  const params = useParams();
  const workflowId = params.workflowId as string;

  // 构造聊天面板的URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const workflowUrl = `${baseUrl}/workflows/${workflowId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(workflowUrl);
      toast.success("Workflow URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chat Trigger</DialogTitle>
          <DialogDescription>
            This trigger activates when a message is sent in the chat panel.
            Users can interact with your workflow through the chat interface.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workflow-url">Workflow URL</Label>
            <div className="flex gap-2">
              <Input
                id="workflow-url"
                value={workflowUrl}
                readOnly
                className="text-sm font-mono"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this URL to allow others to interact with your workflow through chat.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">How it works</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>When a user sends a message in the chat panel, this trigger activates</li>
              <li>The message content is available as <code className="bg-background px-1 py-0.5 rounded">{"{{chat.message}}"}</code></li>
              <li>The workflow continues with the next node after processing the message</li>
            </ul>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Available Variables</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                <code className="bg-background px-1 py-0.5 rounded">{"{{chat.message}}"}</code> - 
                The message content sent by the user
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">{"{{json chat}}"}</code> - 
                Complete chat data as JSON
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};