import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the Better Auth portal API which is already configured with Polar
    const portalResponse = await auth.api.portal({
      headers: Object.fromEntries(request.headers),
    });

    if (!portalResponse?.url) {
      return NextResponse.json(
        { error: "Failed to create billing portal session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: portalResponse.url });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 },
    );
  }
}
