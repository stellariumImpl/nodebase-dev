"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, User } from "lucide-react";

interface SubscriptionData {
  status: string;
  currentPeriodEnd: string;
  plan: {
    name: string;
    price: string;
  };
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/polar/subscription");
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleManageBilling = async () => {
    try {
      setIsManaging(true);

      // Get portal URL from Polar API
      const response = await fetch("/api/polar/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const { portalUrl } = await response.json();
        window.location.href = portalUrl;
      } else {
        throw new Error("Failed to create billing portal session");
      }
    } catch (error) {
      console.error("Billing portal error:", error);
      // Handle error (show toast, etc.)
    } finally {
      setIsManaging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {subscription ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="font-semibold">{subscription.plan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      subscription.status === "active"
                        ? "default"
                        : subscription.status === "canceled"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {subscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-semibold">{subscription.plan.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renews</p>
                  <p className="font-semibold">
                    {new Date(
                      subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleManageBilling}
                disabled={isManaging}
                className="w-full"
                size="lg"
              >
                {isManaging ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <User className="w-4 h-4 mr-2" />
                )}
                Manage Billing
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No active subscription
              </p>
              <Button asChild>
                <a href="/upgrade">Upgrade to Pro</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {subscription && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View and download your past invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">
                Visit the billing portal to view your complete billing history and invoices.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleManageBilling}
              >
                View Billing Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
