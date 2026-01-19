"use client";

import { Loader } from "@/components/ui/loader";
import { useState, useEffect } from "react";

import { Button } from "./ui/button";
import {
  CreditCardIcon,
  FolderOpenIcon,
  HistoryIcon,
  KeyIcon,
  LogOutIcon,
  StarIcon,
  ChevronRight,
  X,
} from "lucide-react";
import { Hint } from "@/components/hint";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarTrigger,
} from "./ui/sidebar";

import { authClient } from "@/lib/auth-client";
import { Logo } from "./logo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useHasActiveSubscription } from "@/features/subscriptions/hooks/use-subscription";

const menuItems = [
  {
    title: "Workflows",
    items: [
      { title: "Workflows", icon: FolderOpenIcon, url: "/workflows" },
      { title: "Credentials", icon: KeyIcon, url: "/credentials" },
      { title: "Executions", icon: HistoryIcon, url: "/executions" },
    ],
  },
];

export const AppSidebar = () => {
  const { state, isMobile, setOpen, setOpenMobile } = useSidebar();
  const isExpanded = state === "expanded";
  const isCollapsed = state === "collapsed";

  const [hoveringLogo, setHoveringLogo] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  const { hasActiveSubscription, isLoading } = useHasActiveSubscription();

  return (
    <Sidebar
      collapsible="icon"
      className="transition-all duration-200 data-[state=collapsed]:w-14"
    >
      <SidebarHeader className="flex flex-row items-center h-12 px-2">
        {isMobile ? (
          <div className="flex w-full items-center justify-between px-2">
            <div
              className={cn(
                "flex items-center gap-2",
                "p-1 rounded-md",
                "cursor-pointer",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "transition-colors",
              )}
              onClick={() => router.push("/")}
            >
              <Logo size={15} />
              {/* modification: 在这里添加移动端标题 */}
              <span className="font-semibold text-sm">Nodebase</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpenMobile(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <>
            {/* 1. 外层容器：用于排列 Logo 和 标题 */}
            <div className="flex items-center gap-2">
              <Hint
                label={isCollapsed ? "Expand Sidebar" : "Home"}
                side="bottom"
                align="center"
              >
                <button
                  onMouseEnter={() => isCollapsed && setHoveringLogo(true)}
                  onMouseLeave={() => setHoveringLogo(false)}
                  onClick={() => {
                    // 1. 如果侧边栏折叠，先展开
                    if (isCollapsed) setOpen(true);
                    // 2. 否则是logo，跳转回主页
                    else router.push("/");
                  }}
                  className={cn(
                    "flex items-center justify-center",
                    "h-7 w-7 shrink-0 rounded-md", // shrink-0 防止被压缩
                    "text-foreground",
                    "transition-colors select-none",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                >
                  {isCollapsed && hoveringLogo ? (
                    <ChevronRight className="size-4" strokeWidth={2} />
                  ) : (
                    <Logo size={16} />
                  )}
                </button>
              </Hint>

              {!isCollapsed && (
                <span
                  onClick={() => router.push("/")}
                  className="font-bold text-sm truncate transition-all duration-200 cursor-pointer"
                >
                  Nodebase
                </span>
              )}
            </div>

            {isExpanded && (
              <Hint label="Collapse Sidebar" side="right" align="start">
                <SidebarTrigger className="ml-auto" />
              </Hint>
            )}
          </>
        )}
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupContent className="space-y-1">
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={
                          item.url === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.url)
                        }
                        asChild
                        className="
                          h-10 px-3 rounded-md gap-x-3
                          data-[state=collapsed]:justify-center
                        "
                      >
                        <Link
                          href={item.url}
                          prefetch
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span className="data-[state=collapsed]:hidden">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {!hasActiveSubscription && !isLoading && (
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-10 px-3 gap-x-3"
                tooltip="Upgrade to Pro"
                onClick={() => authClient.checkout({ slug: "pro" })}
              >
                <StarIcon className="w-5 h-5" />
                <span className="data-[state=collapsed]:hidden">
                  Upgrade to Pro
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-10 px-3 gap-x-3"
              tooltip="Billing portal"
              onClick={() => authClient.customer.portal()}
            >
              <CreditCardIcon className="w-5 h-5" />
              <span className="data-[state=collapsed]:hidden">
                Billing portal
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-10 px-3 gap-x-3"
              tooltip="Sign out"
              onClick={() => {
                setIsSigningOut(true);
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/login";
                    },
                    onError: () => {
                      setIsSigningOut(false);
                      toast.error("Failed to sign out");
                    },
                  },
                });
              }}
            >
              <LogOutIcon className="w-5 h-5" />
              <span className="data-[state=collapsed]:hidden">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {isSigningOut && <Loader variant="fullscreen" />}
    </Sidebar>
  );
};
