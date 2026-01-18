"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const AppHeader = () => {
  return (
    <header className="flex shrink-0 h-11 items-center gap-2 border-b px-4 bg-background transition-all duration-300 ease-in-out">
      {/* 手机端左上角：折叠按钮，md 以上隐藏 */}
      <SidebarTrigger className="md:hidden" />

      <div className="flex-1" />

      {/* 右侧主题切换，PC 和 Mobile 都保留 */}
      <ThemeSwitcher />
    </header>
  );
};
