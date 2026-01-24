import { atom } from "jotai";

// Global atom to track when workflow execution starts
export const nodeStatusResetAtom = atom<number>(0);

// Function to trigger reset of all node statuses
export const triggerNodeStatusResetAtom = atom(
  null,
  (get, set) => {
    const current = get(nodeStatusResetAtom);
    set(nodeStatusResetAtom, current + 1);
  }
);