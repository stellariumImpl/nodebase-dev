import { useEffect, useMemo, useRef } from "react";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useSetAtom } from "jotai";

import { fetchWorkflowResetToken } from "@/inngest/actions/workflow-reset";
import { triggerNodeStatusResetAtom } from "@/features/executions/store/node-status-store";
import { WORKFLOW_RESET_CHANNEL_NAME } from "@/inngest/channels/workflow-reset";

const clearStoredStatuses = (workflowId: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(`workflow-node-status:${workflowId}`);
};

const getResetStorageKey = (workflowId: string) =>
  `workflow-node-status-reset:${workflowId}`;

const readStoredResetExecutionId = (workflowId: string) => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getResetStorageKey(workflowId));
  if (!raw) {
    return null;
  }

  return raw;
};

const writeStoredResetExecutionId = (
  workflowId: string,
  executionId: string,
) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getResetStorageKey(workflowId), executionId);
};

export const useWorkflowReset = (workflowId: string) => {
  const triggerNodeStatusReset = useSetAtom(triggerNodeStatusResetAtom);
  const { data } = useInngestSubscription({
    refreshToken: fetchWorkflowResetToken,
    enabled: true,
  });

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
          msg.data.workflowId === workflowId,
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

    const storedExecutionId = readStoredResetExecutionId(workflowId);
    if (
      latestReset.data.executionId === lastExecutionIdRef.current ||
      latestReset.data.executionId === storedExecutionId
    ) {
      return;
    }

    lastExecutionIdRef.current = latestReset.data.executionId;

    writeStoredResetExecutionId(workflowId, latestReset.data.executionId);

    triggerNodeStatusReset(new Date(latestReset.createdAt).getTime());
    clearStoredStatuses(workflowId);
  }, [latestReset, triggerNodeStatusReset, workflowId]);
};
