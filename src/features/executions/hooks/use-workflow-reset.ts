import { useEffect, useMemo, useRef } from "react";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useSetAtom } from "jotai";

import { fetchWorkflowResetToken } from "@/inngest/actions/workflow-reset";
import { triggerNodeStatusResetAtom } from "@/features/executions/store/node-status-store";
import { WORKFLOW_RESET_CHANNEL_NAME } from "@/inngest/channels/workflow-reset";

export const useWorkflowReset = (workflowId: string) => {
  const triggerNodeStatusReset = useSetAtom(triggerNodeStatusResetAtom);
  const { data } = useInngestSubscription({
    refreshToken: fetchWorkflowResetToken,
    enabled: true,
  });

  const startedAt = useRef<number>(Date.now());
  const lastExecutionIdRef = useRef<string | null>(null);

  const latestReset = useMemo(() => {
    if (!data?.length) {
      return null;
    }

    return data
      .filter(
        (msg) =>
          msg.kind === "data" &&
          msg.channel === WORKFLOW_RESET_CHANNEL_NAME &&
          msg.topic === "reset" &&
          msg.data.workflowId === workflowId &&
          new Date(msg.createdAt).getTime() > startedAt.current,
      )
      .sort((a, b) => {
        if (a.kind === "data" && b.kind === "data") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return 0;
      })[0];
  }, [data, workflowId]);

  useEffect(() => {
    if (latestReset?.kind !== "data") {
      return;
    }

    if (latestReset.data.executionId === lastExecutionIdRef.current) {
      return;
    }

    lastExecutionIdRef.current = latestReset.data.executionId;
    triggerNodeStatusReset();
  }, [latestReset, triggerNodeStatusReset]);
};
