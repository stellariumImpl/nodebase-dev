import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { useParams } from "next/navigation";
import { BaseTriggerNode } from "../base-trigger-node";
import { GoogleFormTriggerDialog } from "./dialog";

import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { fetchGoogleFormTriggerRealtimeToken } from "./actions";
import { GOOGLE_FORM_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/google-form-trigger";

export const GoogleFormTrigger = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const params = useParams();
  const workflowId = params?.workflowId as string | undefined;
  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    workflowId,
    channel: GOOGLE_FORM_TRIGGER_CHANNEL_NAME,
    // channel: httpRequestChannel().name,
    topic: "status",
    refreshToken: fetchGoogleFormTriggerRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);
  return (
    <>
      <GoogleFormTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon="/logos/googleform.svg"
        name="Google Form"
        description="When form is submitted"
        status={nodeStatus} // TODO
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings} // TODO
      />
    </>
  );
});
