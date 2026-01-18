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
  // 1. 新增 mounted 状态，默认为 false
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    // 2. 组件在客户端挂载完成后，设置为 true
    setMounted(true);

    const saved = (localStorage.getItem("theme") as any) || "system";
    setMode(saved);
  }, []);

  const cycle = () => {
    const nextMode = next[mode];
    setMode(nextMode);
    applyTheme(nextMode);
  };

  // 3. 如果还没挂载（即在服务端或客户端初次渲染时），渲染一个空的占位按钮
  // 这样保证了服务端和客户端初次渲染的 HTML 是完全一样的
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md transition-all"
        disabled // 可选：加载中禁止点击
      >
        {/* 这里留空，或者放一个默认的 Loader，防止图标闪烁 */}
        <span className="sr-only">Loading theme</span>
      </Button>
    );
  }

  // 4. 挂载完成后，渲染真正的图标
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
      className="h-7 w-7 rounded-md transition-all"
      aria-label="Toggle theme"
    >
      {icon}
    </Button>
  );
}
