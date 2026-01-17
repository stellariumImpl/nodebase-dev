"use client";

import { Loader } from "@/components/ui/loader";
import { useState } from "react";

import {
  CreditCardIcon,
  FolderOpenIcon,
  HistoryIcon,
  KeyIcon,
  LogOutIcon,
  StarIcon,
} from "lucide-react";

import Image from "next/image";
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
} from "./ui/sidebar";

// import { GalleryVerticalEnd } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Logo } from "./logo";
import { toast } from "sonner";

const menuItems = [
  {
    title: "Workflows",
    items: [
      {
        title: "Workflows",
        icon: FolderOpenIcon,
        url: "/workflows",
      },
      {
        title: "Credentials",
        icon: KeyIcon,
        url: "/credentials",
      },
      {
        title: "Executions",
        icon: HistoryIcon,
        url: "/executions",
      },
    ],
  },
];

export const AppSidebar = () => {
  // NOTE: self-modified, for signing out loader
  const [isSigningOut, setIsSigningOut] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[state=collapsed]:p-0 data-[state=collapsed]:justify-center"
            >
              <Link href="/" prefetch>
                <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-orange-500">
                  <Logo size={20} className="text-white dark:text-sidebar" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Nodebase</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Dev
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupContent className="space-y-1">
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={
                        item.url === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.url)
                      }
                      asChild
                      className="gap-x-4 h-10 px-4 rounded-md 
                    data-[active=true]:bg-primary/10 
                    data-[active=true]:text-primary 
                    data-[active=true]:font-medium"
                    >
                      <Link href={item.url} prefetch>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Upgrade to Pro"
              className="gap-x-4 h-10 px-4"
              onClick={() => {
                alert("Upgrade to Pro function need to be done later");
              }}
            >
              <StarIcon className="h-4 w-4 " />
              <span>Upgrade to Pro</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Billing portal"
              className="gap-x-4 h-10 px-4"
              onClick={() => {
                alert("Billing portal function need to be done later");
              }}
            >
              <CreditCardIcon className="h-4 w-4 " />
              <span>Billing portal</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              className="gap-x-4 h-10 px-4"
              onClick={() => {
                setIsSigningOut(true);
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/login");
                    },
                    onError: () => {
                      setIsSigningOut(false);
                      toast.error("Failed to sign out");
                    },
                  },
                });
              }}
            >
              <LogOutIcon className="h-4 w-4 " />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      {isSigningOut && <Loader variant="fullscreen" />}
    </Sidebar>
  );
};
