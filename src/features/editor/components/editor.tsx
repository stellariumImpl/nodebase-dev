"use client";

import { ErrorView, LoadingView } from "@/components/entity-components";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeComponents } from "@/config/node-components";

import { AddNodeButton } from "./add-node-button";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  editorAtom,
  lastSavedSnapshotAtom,
  workflowSaveCountdownAtom,
  workflowSaveStatusAtom,
} from "../store/atoms";

import { NodeType } from "@/generated/prisma/enums";
import { ExecuteWorkflowButton } from "./execute-workflow-button";

import { useUpdateWorkflow } from "@/features/workflows/hooks/use-workflows";
import {
  serializeWorkflowSnapshot,
  toPersistedWorkflow,
} from "../utils/workflow-serializer";

import { TriggerHideMiniMapWhenNarrowButton } from "./trigger-hide-minimap-when-narrow-button";

export const EditorLoading = () => {
  return <LoadingView message="Loading editor..." />;
};

export const EditorError = () => {
  return <ErrorView message="Error loading editor" />;
};

const EditorSaveStatusPanel = () => {
  const saveStatus = useAtomValue(workflowSaveStatusAtom);
  const saveCountdown = useAtomValue(workflowSaveCountdownAtom);
  const [showSavedStatus, setShowSavedStatus] = useState(false);

  useEffect(() => {
    if (saveStatus === "saved") {
      setShowSavedStatus(true);
      const timeout = setTimeout(() => {
        setShowSavedStatus(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }

    setShowSavedStatus(false);
    return undefined;
  }, [saveStatus]);

  const statusLabel = (() => {
    switch (saveStatus) {
      case "unsaved":
        return saveCountdown ? `Unsaved · ${saveCountdown}s` : "Unsaved";
      case "saving":
        return "Saving...";
      case "saved":
        return showSavedStatus ? "Saved" : null;
      case "failed":
        return "Save failed";
      default:
        return null;
    }
  })();

  if (!statusLabel) {
    return null;
  }

  return (
    <Panel position="top-center" className="pointer-events-none select-none">
      <div
        className="text-xs text-muted-foreground bg-background/70 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm"
        aria-live="polite"
      >
        {statusLabel}
      </div>
    </Panel>
  );
};

export const Editor = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);

  const setEditor = useSetAtom(editorAtom);
  const saveStatus = useAtomValue(workflowSaveStatusAtom);
  const setSaveStatus = useSetAtom(workflowSaveStatusAtom);
  const setSaveCountdown = useSetAtom(workflowSaveCountdownAtom);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useAtom(
    lastSavedSnapshotAtom,
  );

  const [nodes, setNodes] = useState<Node[]>(workflow.nodes);
  const [edges, setEdges] = useState<Edge[]>(workflow.edges);

  const [isNarrow, setIsNarrow] = useState(false);
  const [showMiniMapOnNarrow, setShowMiniMapOnNarrow] = useState(false);

  const saveWorkflow = useUpdateWorkflow({ showToast: false });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoSaveAttemptSnapshotRef = useRef<string | null>(null);
  const lastWorkflowIdRef = useRef<string | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSaveCountdown(null);
  }, [setSaveCountdown]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const isTouch =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const hasManualTrigger = useMemo(() => {
    return nodes.some((node) => node.type === NodeType.MANUAL_TRIGGER);
  }, [nodes]);

  const snapshot = useMemo(() => {
    return serializeWorkflowSnapshot(nodes, edges);
  }, [nodes, edges]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");

    const handleChange = (event: MediaQueryListEvent) => {
      setIsNarrow(event.matches);
      if (!event.matches) {
        setShowMiniMapOnNarrow(false);
      }
    };

    setIsNarrow(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    const initialSnapshot = serializeWorkflowSnapshot(
      workflow.nodes,
      workflow.edges,
    );

    const isNewWorkflow = lastWorkflowIdRef.current !== workflowId;
    if (!isNewWorkflow) {
      return;
    }

    lastWorkflowIdRef.current = workflowId;
    setNodes(workflow.nodes);
    setEdges(workflow.edges);

    setLastSavedSnapshot(initialSnapshot);
    setSaveStatus("saved");
    clearCountdown();
    lastAutoSaveAttemptSnapshotRef.current = null;
  }, [
    workflowId,
    workflow.nodes,
    workflow.edges,
    clearCountdown,
    setLastSavedSnapshot,
    setSaveStatus,
  ]);

  useEffect(() => {
    if (!lastSavedSnapshot) return;
    if (snapshot === lastSavedSnapshot) {
      if (saveStatus !== "saving") {
        setSaveStatus("saved");
      }
      clearCountdown();
      return;
    }

    if (saveStatus === "saving") {
      clearCountdown();
      return;
    }

    if (saveStatus !== "unsaved") {
      setSaveStatus("unsaved");
    }

    if (!countdownIntervalRef.current) {
      clearCountdown();
      setSaveCountdown(5);
      let secondsRemaining = 5;
      countdownIntervalRef.current = setInterval(() => {
        secondsRemaining -= 1;
        setSaveCountdown(secondsRemaining > 0 ? secondsRemaining : null);
        if (secondsRemaining <= 0) {
          clearCountdown();
        }
      }, 1000);
    }

    if (snapshot === lastAutoSaveAttemptSnapshotRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const snapshotToSave = snapshot;
    const { nodes: nodesToSave, edges: edgesToSave } = toPersistedWorkflow(
      nodes,
      edges,
    );

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      clearCountdown();
      lastAutoSaveAttemptSnapshotRef.current = snapshotToSave;
      try {
        await saveWorkflow.mutateAsync({
          id: workflowId,
          nodes: nodesToSave,
          edges: edgesToSave,
        });
        setLastSavedSnapshot(snapshotToSave);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("failed");
      }
    }, 5000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      clearCountdown();
    };
  }, [
    snapshot,
    lastSavedSnapshot,
    nodes,
    edges,
    saveWorkflow,
    clearCountdown,
    setLastSavedSnapshot,
    setSaveCountdown,
    setSaveStatus,
    saveStatus,
    workflowId,
  ]);

  const handleToggleMiniMapOnNarrow = useCallback(() => {
    setShowMiniMapOnNarrow((prev) => !prev);
  }, []);

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeComponents}
        onInit={setEditor}
        fitView
        proOptions={{
          hideAttribution: true,
        }}
        snapGrid={[10, 10]}
        snapToGrid
        panOnScroll
        panOnDrag
        selectionOnDrag={false}
      >
        <Background />
        <Controls />
        <MiniMap className="hidden sm:block" />
        <EditorSaveStatusPanel />
        {isNarrow && showMiniMapOnNarrow && (
          <Panel
            position="bottom-right"
            className="sm:hidden"
            style={{ marginBottom: 46, marginRight: 0 }}
          >
            <MiniMap className="block" />
          </Panel>
        )}
        <Panel position="top-right">
          <AddNodeButton />
        </Panel>
        {isNarrow && (
          <Panel position="bottom-right" className="sm:hidden">
            <TriggerHideMiniMapWhenNarrowButton
              isOpen={showMiniMapOnNarrow}
              onToggle={handleToggleMiniMapOnNarrow}
            />
          </Panel>
        )}
        {hasManualTrigger && (
          <Panel position="bottom-center">
            <ExecuteWorkflowButton workflowId={workflowId} />
          </Panel>
        )}
        {!isTouch && (
          <Panel
            position="top-left"
            className="pointer-events-none select-none"
          >
            <div className="text-xs text-muted-foreground bg-background/70 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
              Select: Shift + Drag
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
