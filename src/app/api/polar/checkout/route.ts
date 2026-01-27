import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { polarClient } from "@/lib/polar";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productSlug } = await request.json();

    if (!productSlug) {
      return NextResponse.json(
        { error: "Product slug is required" },
        { status: 400 },
      );
    }

    // 方法1: 尝试使用 Better Auth checkout API
    try {
      const checkoutResponse = await auth.api.checkout({
        headers: Object.fromEntries(request.headers),
        body: {
          productId: "800b3055-dba9-43f9-8839-f4b5f701e987",
        },
      });

      if (checkoutResponse?.url) {
        return NextResponse.json({ checkoutUrl: checkoutResponse.url });
      }
    } catch (authError) {
      console.log("Better Auth checkout failed, trying Polar SDK directly:", authError);
    }

    // 方法2: 如果Better Auth失败，直接使用Polar SDK
    try {
      // 获取customer ID
      const customer = await polarClient.customers.getStateExternal({
        externalId: session.user.id,
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found in Polar" },
          { status: 404 }
        );
      }

      // 创建checkout session
      const checkoutSession = await polarClient.checkouts.create({
        customerId: customer.id,
        products: ["800b3055-dba9-43f9-8839-f4b5f701e987"],
        successUrl: `${process.env.POLAR_SUCCESS_URL}/billing?success=true`,
      });

      if (!checkoutSession?.url) {
        return NextResponse.json(
          { error: "Failed to create checkout session with Polar SDK" },
          { status: 500 }
        );
      }

      return NextResponse.json({ checkoutUrl: checkoutSession.url });
    } catch (polarError) {
      console.error("Polar SDK checkout failed:", polarError);
      return NextResponse.json(
        { error: "All checkout methods failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
