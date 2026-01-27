"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2Icon, Check, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { useSubscription } from "@/features/subscriptions/hooks/use-subscription";
import { Loader } from "@/components/ui/loader"; // 导入全屏 Loader

export default function UpgradePage() {
  const { data: customerState, isLoading: isSubscriptionLoading } =
    useSubscription();
  const [isLoading, setIsLoading] = useState(false);

  const activeSubscription = customerState?.activeSubscriptions?.[0] as any;
  const hasActiveSubscription = Boolean(
    activeSubscription && activeSubscription.status === "active",
  );

  const currentPlanName = useMemo(() => {
    if (isSubscriptionLoading) return null;
    return hasActiveSubscription
      ? (activeSubscription?.product?.name ?? "Pro")
      : "Free";
  }, [isSubscriptionLoading, hasActiveSubscription, activeSubscription]);

  const pricingPlans = useMemo(
    () => [
      {
        name: "Free",
        price: "$0",
        period: "forever",
        description:
          "Perfect for beginners to experience basic workflow automation.",
        features: [
          "Basic workflow nodes",
          "10 executions per month",
          "Community support",
          "Standard processing speed",
        ],
        cta: currentPlanName === "Free" ? "Current Plan" : "Get Started",
        current: currentPlanName === "Free",
      },
      {
        name: "Pro",
        price: "$15",
        period: "per month",
        description:
          "Designed for professionals who need efficient Agent collaboration.",
        features: [
          "Unlimited workflow automation",
          "Unlimited executions",
          "Advanced AI integration",
          "Custom Agent nodes",
          "Priority processing channel",
          "24/7 priority support",
        ],
        cta:
          currentPlanName === "Pro" ? "Current Plan" : "Upgrade to Pro Account",
        highlighted: true,
        current: currentPlanName === "Pro",
      },
    ],
    [currentPlanName],
  );

  const handleUpgrade = async () => {
    try {
      setIsLoading(true); // 开启全屏 Loader
      const response = await fetch("/api/polar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: "pro" }),
      });
      if (response.ok) {
        const { checkoutUrl } = await response.json();
        if (checkoutUrl) {
          window.location.href = checkoutUrl; // 跳转至 Polar 支付页
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 触发全屏加载状态 */}
      {isLoading && <Loader variant="fullscreen" />}

      <div className="w-full min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-5xl px-6 py-12 lg:py-20">
          <div className="text-center space-y-4 mb-16">
            <Badge
              variant="outline"
              className="px-4 py-1 border-primary/20 bg-primary/5 text-primary text-[10px] uppercase tracking-widest"
            >
              Pricing Plans
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Unlock the Full Potential of AI
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that best fits your automation needs. Pro users
              get unlimited Agent calling capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col transition-all duration-300 border-border ${
                  plan.highlighted
                    ? "border-orange-500/50 shadow-2xl shadow-orange-500/10 lg:scale-[1.02] z-10 bg-card"
                    : "bg-card/50 hover:border-primary/20"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-600 hover:bg-orange-600 text-white px-4 py-1 text-[10px] font-bold shadow-lg border-none uppercase tracking-wider">
                      <Sparkles className="size-3 mr-1.5 fill-current" /> Most
                      Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="p-8 pb-0">
                  <div className="mb-4 inline-flex p-2.5 rounded-xl border border-border bg-muted/50">
                    {plan.highlighted ? (
                      <Zap className="size-6 text-orange-500 fill-orange-500/10" />
                    ) : (
                      <ShieldCheck className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="mt-2 leading-relaxed">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /{plan.period}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-8 space-y-6 flex-1">
                  <Separator />
                  <ul className="space-y-4 text-sm text-card-foreground/80">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check
                          className={`size-4 ${plan.highlighted ? "text-orange-600 dark:text-orange-500" : "text-muted-foreground"}`}
                          strokeWidth={3}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-8 pt-0">
                  <Button
                    onClick={plan.highlighted ? handleUpgrade : undefined}
                    disabled={
                      isSubscriptionLoading || plan.current || isLoading
                    }
                    variant={plan.highlighted ? "default" : "outline"}
                    className={`w-full relative h-12 text-sm font-bold transition-all ${
                      plan.highlighted && !plan.current
                        ? "bg-orange-600 hover:bg-orange-700 text-white border-none shadow-lg shadow-orange-600/20"
                        : ""
                    }`}
                  >
                    {!plan.current && (
                      <Zap className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                    )}
                    {isSubscriptionLoading ? "Checking..." : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
