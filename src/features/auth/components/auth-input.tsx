// 局部修改login-form和register-form的input样式

"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Styled wrapper around the base Input component that applies authentication-form input styles.
 *
 * @param className - Additional CSS class names to merge with the component's default styles
 * @returns The Input element with the composed `className` and all other props forwarded
 */
export function AuthInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn(
        "border border-neutral-300 bg-white px-3 py-2 text-[15px] rounded-md",
        "placeholder:text-neutral-400",
        "hover:border-neutral-400",
        "focus:outline-none",
        "disabled:bg-neutral-100 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}