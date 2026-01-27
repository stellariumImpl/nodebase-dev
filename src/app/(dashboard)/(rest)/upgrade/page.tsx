"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Star } from "lucide-react";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Basic workflow automation",
      "Up to 10 executions per month",
      "Community support",
    ],
    cta: "Current Plan",
    current: true,
  },
  {
    name: "Pro",
    price: "$15",
    period: "per month",
    features: [
      "Unlimited workflow automation",
      "Unlimited executions",
      "Priority support",
      "Advanced AI integrations",
      "Custom workflows",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      
      // Use Polar checkout - redirect to Polar's hosted checkout page
      // The correct URL format should be obtained from Polar API
      const response = await fetch("/api/polar/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productSlug: "pro",
        }),
      });

      if (response.ok) {
        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Failed to create checkout session");
      }
      
    } catch (error) {
      console.error("Upgrade error:", error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

    return (
      <div className="container max-w-6xl py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upgrade Your Plan</h1>
        <p className="text-lg text-muted-foreground">
          Choose the plan that works best for your automation needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${
              plan.highlighted
                ? "border-2 border-primary shadow-lg"
                : "border"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="secondary" className="px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button
                onClick={plan.highlighted ? handleUpgrade : undefined}
                disabled={plan.current || isLoading}
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                {isLoading && plan.highlighted ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {plan.current ? plan.cta : plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}