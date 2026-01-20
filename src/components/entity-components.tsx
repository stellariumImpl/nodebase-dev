import {
  AlertTriangleIcon,
  Loader2Icon,
  PackageOpenIcon,
  PlusIcon,
  MoreVerticalIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/hint";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <h1 className="text-xl md:text-xl font-semibold tracking-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground truncate">
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
      {/* 1. 将外层的 gap-y-8 改为 gap-y-6 或者保留 gap-y-8，
           主要通过改变内部结构来调整视觉距离 */}
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-y-8">
        {/* --- 顶部区域：包含 Header 和 Search --- */}
        <div className="flex flex-col gap-y-4 flex-none">
          {header}
          {search}
        </div>

        {/* --- 内容列表区域 --- */}
        {/* Search 移出去了，这里只放 children */}
        <div className="flex flex-col gap-y-4 flex-1 min-h-0">{children}</div>

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
  isSearching?: boolean;
}

export const EntitySearch = ({
  value,
  onChange,
  placeholder = "Search",
  isSearching = false,
}: EntitySearchProps) => {
  return (
    <div className="relative">
      {/* 根据状态切换图标 */}
      {isSearching ? (
        <Loader2Icon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
      ) : (
        <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        className="max-w-[220px] bg-background shadow-none border-border pl-8"
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

interface StateViewProps {
  message?: string;
}

export const LoadingView = ({ message }: StateViewProps) => {
  return (
    <div className="flex justify-center items-center h-full flex-1 flex-col gap-y-4">
      <Loader2Icon className="size-6 animate-spin text-primary" />

      {!!message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
};

export const ErrorView = ({ message }: StateViewProps) => {
  return (
    <div className="flex justify-center items-center h-full flex-1 flex-col gap-y-4">
      <AlertTriangleIcon className="size-6 text-primary" />

      {!!message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
};

interface EmptyViewProps extends StateViewProps {
  onNew?: () => void;
}

export const EmptyView = ({ message, onNew }: EmptyViewProps) => {
  return (
    <Empty className="border border-dashed bg-background">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageOpenIcon />
        </EmptyMedia>
      </EmptyHeader>
      <EmptyTitle>No items</EmptyTitle>
      {!!message && <EmptyDescription>{message}</EmptyDescription>}
      {!!onNew && (
        <EmptyContent>
          <Button onClick={onNew}>Add item</Button>
        </EmptyContent>
      )}
    </Empty>
  );
};

interface EntityListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;

  getKey?: (item: T, index: number) => string | number;
  emptyView?: React.ReactNode;
  className?: string;
}

export function EntityList<T>({
  items,
  renderItem,
  getKey,
  emptyView,
  className,
}: EntityListProps<T>) {
  if (items.length === 0 && emptyView) {
    return (
      <div className="flex-1 flex flex-col justify-start pt-8 w-full">
        {emptyView}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-y-4", className)}>
      {items.map((item, index) => (
        <div key={getKey ? getKey(item, index) : index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

interface EntityItemProps {
  href: string;
  title: string;
  subtitle?: React.ReactNode;
  image?: React.ReactNode;
  actions?: React.ReactNode;
  onRemove?: () => void | Promise<void>;
  isRemoving?: boolean;
  className?: string;
}

export const EntityItem = ({
  href,
  title,
  subtitle,
  image,
  actions,
  onRemove,
  isRemoving,
  className,
}: EntityItemProps) => {
  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isRemoving) {
      return;
    }

    if (onRemove) {
      await onRemove();
    }
  };

  return (
    <Link href={href} prefetch>
      <Card
        className={cn(
          "p-4 shadow-none hover:shadow cursor-pointer",
          isRemoving && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <CardContent className="flex flex-row items-center justify-between p-0">
          <div className="flex items-center gap-3">
            {image}
            <div>
              <CardTitle className="text-base font-medium">{title}</CardTitle>
              {!!subtitle && (
                <CardDescription className="text-xs">
                  {subtitle}
                </CardDescription>
              )}
            </div>
          </div>
          {(actions || onRemove) && (
            <div className="flex gpa-x-4 items-center">
              {actions}
              {onRemove && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVerticalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem onClick={handleRemove}>
                      <TrashIcon className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
