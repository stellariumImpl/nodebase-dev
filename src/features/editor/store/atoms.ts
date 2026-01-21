import type { ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";

export const editorAtom = atom<ReactFlowInstance | null>(null);

export type WorkflowSaveStatus = "unsaved" | "saving" | "saved" | "failed";

export const workflowSaveStatusAtom = atom<WorkflowSaveStatus>("saved");
export const lastSavedSnapshotAtom = atom<string | null>(null);
export const workflowSaveCountdownAtom = atom<number | null>(null);
