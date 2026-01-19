import { PlusIcon } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/hint";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";

type EntityHeaderProps = {
  title: string;
  description?: string;
  newButtonLabel: string;
  disabled?: boolean;
  isCreating?: boolean;
} & (
  | { onNew: () => void; newButtonHref?: never }
  | { newButtonHref: string; onNew?: never }
  | { onNew?: never; newButtonHref?: never }
);

export const EntityHeader = ({
  title,
  description,
  newButtonLabel,
  disabled,
  isCreating,
  onNew,
  newButtonHref,
}: EntityHeaderProps) => {
  // 1. 定义通用按钮渲染函数，避免逻辑重复
  // 参数:
  // - className: 传入特定屏幕尺寸的样式（方形 vs 长条）
  // - content: 按钮里的内容（只有图标 vs 图标+文字）
  const renderCommonButton = (className: string, content: React.ReactNode) => {
    if (onNew) {
      return (
        <Button
          type="button"
          size="sm"
          disabled={disabled || isCreating}
          onClick={onNew}
          className={className}
        >
          {content}
        </Button>
      );
    }

    if (newButtonHref) {
      return (
        <Button
          type="button"
          size="sm"
          disabled={disabled || isCreating}
          asChild
          className={className}
        >
          <Link href={newButtonHref} prefetch>
            {content}
          </Link>
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* --- 左侧：标题与描述 --- */}
      <div className="flex flex-col gap-1 text-left min-w-0">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm md:text-base text-muted-foreground truncate">
            {description}
          </p>
        )}
      </div>

      {/* --- 右侧：按钮区域 --- */}
      <div className="flex items-center">
        {/* 场景 A: 电脑端/宽屏 (md:block)
            特点: 显示文字，不使用 Hint 包裹，按钮是长条形
         */}
        <div className="hidden md:block">
          {renderCommonButton(
            "h-9 w-auto px-4 py-2 shrink-0", // 电脑端样式
            <>
              <PlusIcon className="mr-2 size-4" />
              {newButtonLabel}
            </>,
          )}
        </div>

        {/* 场景 B: 手机端/窄屏 (md:hidden)
            特点: 隐藏文字，使用 Hint 包裹，按钮是正方形
         */}
        <div className="md:hidden">
          <Hint label={newButtonLabel} side="bottom" align="end">
            {/* Hint 内部需要包裹这一层 */}
            {renderCommonButton(
              "h-8 w-8 p-0 shrink-0", // 手机端样式:  正方形, 无padding
              <PlusIcon className="size-4" />, // 只有图标
            )}
          </Hint>
        </div>
      </div>
    </div>
  );
};

type EntityContainerProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  search?: React.ReactNode;
  pagination?: React.ReactNode;
};

export const EntityContainer = ({
  children,
  header,
  search,
  pagination,
}: EntityContainerProps) => {
  return (
    <div className="h-full p-4 md:px-10 md:py-6">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-y-8">
        {/* 头部 */}
        {header && <div className="flex-none">{header}</div>}

        {/* 内容区域 */}
        <div className="flex flex-col gap-y-4 flex-1">
          {search}
          {children}
        </div>

        {/* 分页 */}
        {pagination && <div className="flex-none">{pagination}</div>}
      </div>
    </div>
  );
};

interface EntitySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const EntitySearch = ({
  value,
  onChange,
  placeholder = "Search",
}: EntitySearchProps) => {
  return (
    <div className="relative ml-auto">
      <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="max-w-[200px] bg-background shadow-none border-border pl-8"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

interface EntityPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export const EntityPagination = ({
  page,
  totalPages,
  onPageChange,
  disabled,
}: EntityPaginationProps) => {
  return (
    <div className="flex items-center justify-between gap-x-2 w-full">
      <div className="flex-1 text-sm text-muted-foreground">
        Page {page} of {totalPages || 1}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          disabled={page === 1 || disabled}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          disabled={page === totalPages || totalPages === 0 || disabled}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
