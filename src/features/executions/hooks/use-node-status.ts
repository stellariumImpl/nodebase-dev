import type { Realtime } from "@inngest/realtime";

import { useInngestSubscription } from "@inngest/realtime/hooks";

import { useEffect, useState, useRef } from "react";
import { useAtomValue } from "jotai";

import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { nodeStatusResetAtom } from "@/features/executions/store/node-status-store";

interface UseNodeStatusOptions {
  nodeId: string;
  channel: string;
  topic: string;
  refreshToken: () => Promise<Realtime.Subscribe.Token>;
}

export function useNodeStatus({
  nodeId,
  channel,
  topic,
  refreshToken,
}: UseNodeStatusOptions) {
  const [status, setStatus] = useState<NodeStatus>("initial");
  const resetCounter = useAtomValue(nodeStatusResetAtom);
  const { data } = useInngestSubscription({
    refreshToken,
    enabled: true,
  });
  
  // Track the last reset time to filter messages
  const lastResetTimeRef = useRef<number>(Date.now());

  // Reset status when workflow execution starts
  useEffect(() => {
    setStatus("initial");
    lastResetTimeRef.current = Date.now();
  }, [resetCounter]);

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
          new Date(msg.createdAt).getTime() > lastResetTimeRef.current
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
      if (messageStatus === "loading" || messageStatus === "success" || messageStatus === "error") {
        setStatus(messageStatus);
      }
    }
  }, [data, nodeId, channel, topic]);

  return status;
}
