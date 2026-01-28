import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";

import { BaseTriggerNode } from "../base-trigger-node";
import { MessageSquareIcon } from "lucide-react";
import { ChatTriggerDialog } from "./dialog";

import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { CHAT_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/chat-trigger";
import { fetchChatTriggerRealtimeToken } from "./actions";

export const ChatTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: CHAT_TRIGGER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchChatTriggerRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);
  return (
    <>
      <ChatTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon={MessageSquareIcon}
        name="Chat"
        description="When a message is sent in chat"
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});