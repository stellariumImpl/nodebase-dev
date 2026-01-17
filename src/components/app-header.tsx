"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

export const AppHeader = () => {
  // 获取侧边栏状态
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-2 border-b px-4 bg-background transition-all duration-300 ease-in-out",
        // 根据状态动态切换高度
        isExpanded ? "h-14" : "h-11",
      )}
    >
      <SidebarTrigger />
      <div className="flex-1" />
      <ThemeSwitcher />
    </header>
  );
};
