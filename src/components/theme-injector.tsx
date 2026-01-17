// NOTE: self-modified, 在客户端 hydration 前执行

"use client";

import { useEffect } from "react";
import { applyTheme } from "@/lib/theme";

export function ThemeInjector() {
  useEffect(() => {
    const stored = localStorage.getItem("theme") as any;
    applyTheme(stored || "system");
  }, []);

  return null;
}
