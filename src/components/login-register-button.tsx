"use client";

import * as React from "react";
import { useRef } from "react";
import { Button } from "@/components/ui/button"; // 确保路径正确
import { cn } from "@/lib/utils";

// 修复方案：直接使用 React 的内置类型
interface LoginRegisterButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isPending?: boolean;
}

export function LoginRegisterButton({
  children,
  className,
  isPending,
  ...props
}: LoginRegisterButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    button.style.setProperty("--mouse-x", `${x}px`);
    button.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <Button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      disabled={isPending}
      className={cn(
        "relative overflow-hidden w-full transition-all duration-300",
        // 使用你提供的颜色变量，或者直接写 oklch
        "bg-[oklch(0.6397_0.172_36.4421)] text-white hover:opacity-90",

        // --- 灵动光泽效果 ---
        "before:absolute before:inset-0 before:-z-10",
        "before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        // 使用径向渐变，根据鼠标位置移动
        "before:bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),_rgba(255,255,255,0.3)_0%,_transparent_60%)]",
        className
      )}
      {...props}
    >
      <span className="relative z-10">
        {isPending ? "pending..." : children}
      </span>
    </Button>
  );
}
