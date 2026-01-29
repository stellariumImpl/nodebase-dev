import type { Realtime } from "@inngest/realtime";

import { useInngestSubscription } from "@inngest/realtime/hooks";

import { useEffect, useState, useRef } from "react";
import { useAtomValue } from "jotai";

import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { nodeStatusResetAtom } from "@/features/executions/store/node-status-store";

interface UseNodeStatusOptions {
  nodeId: string;
  workflowId?: string;
  channel: string;
  topic: string;
  refreshToken: () => Promise<Realtime.Subscribe.Token>;
}

type StoredNodeStatus = {
  status: NodeStatus;
  updatedAt: number;
};

const getStorageKey = (workflowId?: string) =>
  workflowId ? `workflow-node-status:${workflowId}` : null;

const readStoredStatuses = (workflowId?: string) => {
  if (typeof window === "undefined") {
    return {};
  }

  const storageKey = getStorageKey(workflowId);
  if (!storageKey) {
    return {};
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, StoredNodeStatus>;
    return parsed ?? {};
  } catch {
    return {};
  }
};

const writeStoredStatuses = (
  workflowId: string | undefined,
  statuses: Record<string, StoredNodeStatus>,
) => {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getStorageKey(workflowId);
  if (!storageKey) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(statuses));
};

export function useNodeStatus({
  nodeId,
  workflowId,
  channel,
  topic,
  refreshToken,
}: UseNodeStatusOptions) {
  const [status, setStatus] = useState<NodeStatus>("initial");
  const lastResetTime = useAtomValue(nodeStatusResetAtom);
  const { data } = useInngestSubscription({
    refreshToken,
    enabled: true,
  });

  // Track the last reset time to filter messages
  const lastResetTimeRef = useRef<number>(0);
  const hasHydratedStatusRef = useRef(false);

  // Reset status when workflow execution starts
  useEffect(() => {
    setStatus("initial");
    lastResetTimeRef.current = lastResetTime;
  }, [lastResetTime]);

  useEffect(() => {
    const storedStatuses = readStoredStatuses(workflowId);
    const storedStatus = storedStatuses[nodeId]?.status;
    if (storedStatus) {
      setStatus(storedStatus);
    }
  }, [nodeId, workflowId]);

  useEffect(() => {
    if (!data?.length) {
      return;
    }

    // Find the latest message for this node that was created AFTER the last reset
    const lastestMessage = data
      .filter(
        (msg) =>
          msg.kind === "data" &&
          msg.channel === channel &&
          msg.topic === topic &&
          msg.data.nodeId === nodeId &&
          new Date(msg.createdAt).getTime() > lastResetTimeRef.current,
      )
      .sort((a, b) => {
        if (a.kind === "data" && b.kind === "data") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return 0;
      })[0];

    if (lastestMessage?.kind === "data") {
      const messageStatus = lastestMessage.data.status;
      if (
        messageStatus === "loading" ||
        messageStatus === "success" ||
        messageStatus === "error"
      ) {
        setStatus(messageStatus);
      }
    }
  }, [data, nodeId, channel, topic]);

  useEffect(() => {
    const storedStatuses = readStoredStatuses(workflowId);

    if (status === "initial") {
      if (!hasHydratedStatusRef.current || lastResetTimeRef.current === 0) {
        return;
      }

      if (storedStatuses[nodeId]) {
        delete storedStatuses[nodeId];
        writeStoredStatuses(workflowId, storedStatuses);
      }
      return;
    }

    storedStatuses[nodeId] = {
      status,
      updatedAt: Date.now(),
    };
    writeStoredStatuses(workflowId, storedStatuses);
  }, [nodeId, status, workflowId]);

  return status;
}
