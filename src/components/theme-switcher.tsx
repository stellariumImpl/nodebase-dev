// NOTE: self-modified

"use client";

import { useState, useEffect } from "react";
import { applyTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";

const next = {
  light: "dark",
  dark: "system",
  system: "light",
} as const;

export function ThemeSwitcher() {
  const [mode, setMode] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    // read initial theme from localStorage / fallback
    const saved = (localStorage.getItem("theme") as any) || "system";
    setMode(saved);
  }, []);

  const cycle = () => {
    const nextMode = next[mode];
    setMode(nextMode);
    applyTheme(nextMode);
  };

  const icon =
    mode === "light" ? (
      <Sun className="h-4 w-4" />
    ) : mode === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    );

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      className="rounded-md transition-all"
      aria-label="Toggle theme"
    >
      {icon}
    </Button>
  );
}
