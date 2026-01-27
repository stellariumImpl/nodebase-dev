"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2Icon,
  CreditCard,
  Calendar,
  User,
  ArrowUpRight,
  ReceiptText,
  Zap,
} from "lucide-react";
import { useSubscription } from "@/features/subscriptions/hooks/use-subscription";
import { Loader } from "@/components/ui/loader"; // 确保导入了 Loader 组件

export default function BillingPage() {
  const { data: customerState, isLoading } = useSubscription();
  const [isManaging, setIsManaging] = useState(false);

  const activeSubscription = customerState?.activeSubscriptions?.[0] as any;
  const hasActiveSubscription = Boolean(activeSubscription);
  const planName = hasActiveSubscription
    ? (activeSubscription?.product?.name ?? "Pro")
    : "Free";
  const planStatus = hasActiveSubscription
    ? (activeSubscription?.status ?? "active")
    : "free";
  const renewalDate =
    activeSubscription?.currentPeriodEnd ?? activeSubscription?.renewsAt;

  const formattedRenewalDate = useMemo(() => {
    if (!renewalDate) return null;
    const parsedDate = new Date(renewalDate);
    return Number.isNaN(parsedDate.getTime())
      ? null
      : parsedDate.toLocaleDateString();
  }, [renewalDate]);

  const formattedPrice = useMemo(() => {
    const price =
      activeSubscription?.price ||
      activeSubscription?.priceAmount ||
      activeSubscription?.amount;

    if (price && typeof price === "object") {
      const amount = price.amount || price.amountValue;
      const currency = price.currency || price.currencyCode || "USD";

      if (amount && currency) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
        }).format(amount / 100);
      }
    }

    if (typeof price === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price / 100);
    }

    return null;
  }, [activeSubscription]);

  const handleManageBilling = async () => {
    try {
      setIsManaging(true); // 开启全屏 Loader
      const response = await fetch("/api/polar/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          // 跳转到外部 URL，页面卸载前保持 isManaging 为 true
          window.location.href = url;
        } else {
          setIsManaging(false);
        }
      } else {
        setIsManaging(false);
      }
    } catch (error) {
      console.error(error);
      setIsManaging(false); // 出错时关闭 Loader
    }
  };

  // 初始加载数据的 Loading 状态
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* 模仿 LoginForm：点击管理按钮时触发全屏加载 */}
      {isManaging && <Loader variant="fullscreen" />}

      <div className="w-full min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-5xl space-y-8 p-6 lg:p-10">
          {/* 标题区 */}
          <div className="flex flex-col gap-2 border-b border-border pb-8 text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              Billing & Subscription
            </h1>
            <p className="text-muted-foreground">
              Manage your subscription plan, update payment methods, and
              download past invoices.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 items-start">
            {/* 左侧主内容 */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border bg-card">
                <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-medium">
                        Current Plan
                      </CardTitle>
                      <CardDescription>
                        Your account is currently on the {planName} plan
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${hasActiveSubscription ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20"} px-3 py-1`}
                    >
                      <span
                        className={`mr-1.5 size-1.5 rounded-full ${hasActiveSubscription ? "bg-emerald-500" : "bg-blue-500"} animate-pulse`}
                      />
                      {hasActiveSubscription ? planStatus : "free"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  {hasActiveSubscription ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                          { label: "Plan Name", value: planName, icon: Zap },
                          {
                            label: "Price",
                            value: formattedPrice ?? "—",
                            icon: CreditCard,
                          },
                          {
                            label: "Renewal Date",
                            value: formattedRenewalDate ?? "—",
                            icon: Calendar,
                          },
                          {
                            label: "Payment Method",
                            value: "Visa ***42",
                            icon: User,
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex flex-col gap-1.5 p-4 rounded-xl bg-muted/50 border border-border/50"
                          >
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              <item.icon className="size-3" /> {item.label}
                            </div>
                            <div className="text-sm font-semibold">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleManageBilling}
                          disabled={isManaging}
                          className="relative h-12 flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium pl-10"
                        >
                          <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/80" />
                          Manage Billing & Payment Info
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 border-border hover:bg-muted font-medium"
                          asChild
                        >
                          <Link href="/upgrade">View Benefits</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center space-y-4">
                      <p className="text-muted-foreground font-medium">
                        You are currently on the Free plan
                      </p>
                      <Button
                        asChild
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Link href="/upgrade">Upgrade to Pro Now</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 账单历史 */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ReceiptText className="size-4 text-muted-foreground" />{" "}
                    Recent Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm p-4 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">
                      All PDF invoices are securely hosted by Polar
                    </span>
                    <Button
                      variant="link"
                      onClick={handleManageBilling}
                      disabled={isManaging}
                      className="text-orange-600 dark:text-orange-500 h-auto p-0 font-semibold"
                    >
                      Download Now <ArrowUpRight className="ml-1 size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧侧边栏 */}
            <div className="space-y-6">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Polar Portal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-card-foreground/80">
                  <p>
                    We use <strong>Polar.sh</strong> to process payments. Your
                    payment data is protected with bank-level encryption.
                  </p>
                  <Separator />
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="size-1 rounded-full bg-orange-500" />{" "}
                      Update credit card information
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1 rounded-full bg-orange-500" /> Add
                      company tax ID (VAT)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1 rounded-full bg-orange-500" />{" "}
                      Cancel auto-renewal
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
