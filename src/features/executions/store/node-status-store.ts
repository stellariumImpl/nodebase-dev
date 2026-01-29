import { atom } from "jotai";

// Global atom to track the latest workflow reset timestamp
export const nodeStatusResetAtom = atom<number>(0);

// Function to trigger reset of all node statuses
export const triggerNodeStatusResetAtom = atom(
  null,
  (_get, set, resetTime?: number) => {
    set(nodeStatusResetAtom, resetTime ?? Date.now());
  }
);
