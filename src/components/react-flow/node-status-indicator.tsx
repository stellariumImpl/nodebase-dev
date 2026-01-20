import { type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type NodeStatus = "loading" | "success" | "error" | "initial";

export type NodeStatusVariant = "overlay" | "border";

export type NodeStatusIndicatorProps = {
  status?: NodeStatus;
  variant?: NodeStatusVariant;
  children: ReactNode;
  className?: string;
};

export const SpinnerLoadingIndicator = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <div className="relative inline-block">
      {/* 外边框：更柔和的蓝色 + 轻微描边感 */}
      <StatusBorder className="border-blue-700/80 shadow-[0_0_0_1px_rgba(37,99,235,0.55)]">
        {children}
      </StatusBorder>

      {/* 半透明遮罩 + 轻微模糊 */}
      <div className="absolute inset-0 z-40 rounded-[9px] bg-background/55 backdrop-blur-[2px]" />

      {/* 中心 spinner：去掉 ping，仅保留细致旋转 */}
      <div className="absolute inset-0 z-50 flex items-center justify-center">
        <LoaderCircle className="size-[22px] text-blue-700 animate-spin" />
      </div>
    </div>
  );
};

export const BorderLoadingIndicator = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div className="absolute -top-[2px] -left-[2px] h-[calc(100%+4px)] w-[calc(100%+4px)] pointer-events-none">
        <style>
          {`
            @keyframes spin-border {
              from { transform: translate(-50%, -50%) rotate(0deg); }
              to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            .node-border-spinner {
              animation: spin-border 1s linear infinite;
              position: absolute;
              left: 50%;
              top: 50%;
              width: 140%;
              aspect-ratio: 1;
              transform-origin: center;
            }
          `}
        </style>
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-md",
            className,
          )}
        >
          <div className="node-border-spinner rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(14,165,233,0.4)_0deg,rgba(14,165,233,0.1)_180deg,rgba(14,165,233,0.4)_360deg)]" />
        </div>
      </div>
      {children}
    </>
  );
};

const StatusBorder = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div
        className={cn(
          "absolute -top-[2px] -left-[2px] h-[calc(100%+4px)] w-[calc(100%+4px)] rounded-md border-2",
          className,
        )}
      />
      {children}
    </>
  );
};

export const NodeStatusIndicator = ({
  status,
  variant = "border",
  children,
  className,
}: NodeStatusIndicatorProps) => {
  switch (status) {
    case "loading":
      switch (variant) {
        case "overlay":
          return <SpinnerLoadingIndicator>{children}</SpinnerLoadingIndicator>;
        case "border":
          return (
            <BorderLoadingIndicator className={className}>
              {children}
            </BorderLoadingIndicator>
          );
        default:
          return <>{children}</>;
      }
    case "success":
      return (
        <StatusBorder
          className={cn(
            "border-green-600/55 shadow-[0_0_0_1px_rgba(34,197,94,0.25)]",
            className,
          )}
        >
          {children}
        </StatusBorder>
      );
    case "error":
      return (
        <StatusBorder
          className={cn(
            "border-red-600/60 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]",
            className,
          )}
        >
          {children}
        </StatusBorder>
      );
    default:
      return <>{children}</>;
  }
};
