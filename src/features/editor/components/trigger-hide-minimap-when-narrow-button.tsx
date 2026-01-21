"use client";

import { MapIcon } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";

interface TriggerHideMiniMapWhenNarrowButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const TriggerHideMiniMapWhenNarrowButton = memo(
  ({ isOpen, onToggle }: TriggerHideMiniMapWhenNarrowButtonProps) => {
    return (
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="bg-background"
        onClick={onToggle}
        aria-pressed={isOpen}
        aria-label={isOpen ? "Hide minimap" : "Show minimap"}
      >
        <MapIcon />
      </Button>
    );
  },
);

TriggerHideMiniMapWhenNarrowButton.displayName =
  "TriggerHideMiniMapWhenNarrowButton";
