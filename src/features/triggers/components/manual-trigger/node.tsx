import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { useParams } from "next/navigation";

import { BaseTriggerNode } from "../base-trigger-node";
import { MousePointerIcon } from "lucide-react";
import { ManualTriggerDialog } from "./dialog";

import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { MANUAL_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/manual_trigger";
import { fetchManualTriggerRealtimeToken } from "./actions";

export const ManualTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const params = useParams();
  const workflowId = params?.workflowId as string | undefined;

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    workflowId,
    channel: MANUAL_TRIGGER_CHANNEL_NAME,
    // channel: httpRequestChannel().name,
    topic: "status",
    refreshToken: fetchManualTriggerRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);
  return (
    <>
      <ManualTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon={MousePointerIcon}
        name="When clicking on 'Execute workflow'"
        status={nodeStatus} // TODO
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings} // TODO
      />
    </>
  );
});
