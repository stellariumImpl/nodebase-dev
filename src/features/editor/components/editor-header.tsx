"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  useSuspenseWorkflow,
  useUpdateWorkflowName,
  useUpdateWorkflow,
} from "@/features/workflows/hooks/use-workflows";
// import { useAtomValue } from "jotai";
// import { editorAtom } from "../store/atoms";

import { useAtomValue, useSetAtom } from "jotai";
import {
  editorAtom,
  lastSavedSnapshotAtom,
  // workflowSaveCountdownAtom,
  workflowSaveStatusAtom,
} from "../store/atoms";
import {
  serializeWorkflowSnapshot,
  toPersistedWorkflow,
} from "../utils/workflow-serializer";

export const EditorNameInput = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);
  const updateWorkflow = useUpdateWorkflowName();

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(workflow.name);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workflow.name) {
      setName(workflow.name);
    }
  }, [workflow.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (name === workflow.name) {
      setIsEditing(false);
      return;
    }

    try {
      await updateWorkflow.mutateAsync({
        id: workflowId,
        name,
      });
    } catch {
      setName(workflow.name);
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setName(workflow.name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <BreadcrumbItem className="flex flex-1 min-w-0">
        <Input
          disabled={updateWorkflow.isPending}
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-7 px-2 w-full min-w-0"
        />
      </BreadcrumbItem>
    );
  }

  return (
    // <Breadcrumb
    //   onClick={() => setIsEditing(true)}
    //   className="cursor-pointer hover:text-foreground transition-colors"
    // >
    //   {workflow.name}
    // </Breadcrumb>
    <BreadcrumbItem className="min-w-0">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="max-w-[40vw] sm:max-w-[50vw] md:max-w-[60vw] truncate text-foreground font-normal hover:text-foreground transition-colors"
        aria-label="Edit workflow name"
      >
        {workflow.name}
      </button>
    </BreadcrumbItem>
  );
};

export const EditorBreadcrumbs = ({ workflowId }: { workflowId: string }) => {
  return (
    <Breadcrumb>
      {/* <BreadcrumbList> */}
      <BreadcrumbList className="min-w-0 flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link prefetch href="/workflows">
              Workflows
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <EditorNameInput workflowId={workflowId} />
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export const EditorSaveButton = ({ workflowId }: { workflowId: string }) => {
  const editor = useAtomValue(editorAtom);
  const saveWorkflow = useUpdateWorkflow();

  // const saveCountdown = useAtomValue(workflowSaveCountdownAtom);
  // const saveStatus = useAtomValue(workflowSaveStatusAtom);
  const setSaveStatus = useSetAtom(workflowSaveStatusAtom);
  const setLastSavedSnapshot = useSetAtom(lastSavedSnapshotAtom);
  // const [showSavedStatus, setShowSavedStatus] = useState(false);

  // const handleSave = () => {
  const handleSave = async () => {
    if (!editor) return;

    const nodes = editor.getNodes();
    const edges = editor.getEdges();

    // saveWorkflow.mutate({
    //   id: workflowId,
    const snapshot = serializeWorkflowSnapshot(nodes, edges);
    const { nodes: nodesToSave, edges: edgesToSave } = toPersistedWorkflow(
      nodes,
      edges,
      // });
    );

    setSaveStatus("saving");
    try {
      await saveWorkflow.mutateAsync({
        id: workflowId,
        nodes: nodesToSave,
        edges: edgesToSave,
      });
      setLastSavedSnapshot(snapshot);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("failed");
    }
  };

  // useEffect(() => {
  //   if (saveStatus === "saved") {
  //     setShowSavedStatus(true);
  //     const timeout = setTimeout(() => {
  //       setShowSavedStatus(false);
  //     }, 2000);
  //     return () => clearTimeout(timeout);
  //   }

  //   setShowSavedStatus(false);
  //   return undefined;
  // }, [saveStatus]);

  // const statusLabel = (() => {
  //   switch (saveStatus) {
  //     case "unsaved":
  //       return saveCountdown ? `Unsaved · ${saveCountdown}s` : "Unsaved";
  //     case "saving":
  //       return "Saving...";
  //     case "saved":
  //       return showSavedStatus ? "Saved" : null;
  //     case "failed":
  //       return "Save failed";
  //     default:
  //       return null;
  //   }
  // })();

  return (
    // <div className="ml-auto">
    <div className="ml-auto flex items-center gap-3">
      {/* {statusLabel ? (
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {statusLabel}
        </span>
      ) : null} */}
      <Button
        className="h-7 w-18"
        size="sm"
        onClick={handleSave}
        disabled={saveWorkflow.isPending}
      >
        <SaveIcon className="size-4" />
        Save
      </Button>
    </div>
  );
};

export const EditorHeader = ({ workflowId }: { workflowId: string }) => {
  return (
    <header className="flex shrink-0 h-11 items-center gap-2 border-b px-4 bg-background transition-all duration-300 ease-in-out">
      {/* 手机端左上角：折叠按钮，md 以上隐藏 */}
      <SidebarTrigger className="md:hidden" />

      <div className="flex flex-row items-center justify-between gap-x-4 w-full">
        <EditorBreadcrumbs workflowId={workflowId} />
        <EditorSaveButton workflowId={workflowId} />
      </div>

      <div className="flex-1" />

      {/* 右侧主题切换，PC 和 Mobile 都保留 */}
      <ThemeSwitcher />
    </header>
  );
};
