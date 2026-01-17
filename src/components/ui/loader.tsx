"use client";

import clsx from "clsx";

type LoaderProps = {
  variant?: "inline" | "fullscreen";
  className?: string;
};

export function Loader({ variant = "inline", className }: LoaderProps) {
  return (
    <div
      className={clsx(
        variant === "fullscreen" &&
          "fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm",
        variant === "inline" && "inline-flex items-center justify-center",
        className
      )}
    >
      <svg className="pl w-24 h-24" viewBox="0 0 240 240">
        <circle
          className="pl__ring pl__ring--a"
          cx={120}
          cy={120}
          r={105}
          fill="none"
          strokeWidth={20}
          strokeDasharray="0 660"
          strokeDashoffset={-330}
          strokeLinecap="round"
        />
        <circle
          className="pl__ring pl__ring--b"
          cx={120}
          cy={120}
          r={35}
          fill="none"
          strokeWidth={20}
          strokeDasharray="0 220"
          strokeDashoffset={-110}
          strokeLinecap="round"
        />
        <circle
          className="pl__ring pl__ring--c"
          cx={85}
          cy={120}
          r={70}
          fill="none"
          strokeWidth={20}
          strokeDasharray="0 440"
          strokeLinecap="round"
        />
        <circle
          className="pl__ring pl__ring--d"
          cx={155}
          cy={120}
          r={70}
          fill="none"
          strokeWidth={20}
          strokeDasharray="0 440"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
