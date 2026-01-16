// import prisma from "@/lib/prisma";
// import { caller } from "@/trpc/server"; // let the page as server component
import { getQueryClient, trpc } from "@/trpc/server";
import { Client } from "./client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

// "use client";
// import { useTRPC } from "@/trpc/client";
// import { useQuery } from "@tanstack/react-query";

// Here we build a boundary between server components and client components
// and we pass the dehydrated query client to the client component
const Page = async () => {
  // const Page = async () => {
  // const users = await prisma.user.findMany();
  // const users = await caller.getUsers(); // NOTE: import "server-only";
  const queryClient = getQueryClient();
  // leverage the speed of server to prefetch the data
  void queryClient.prefetchQuery(trpc.getUsers.queryOptions());

  // Here is the client way for tRPC
  // const trpc = useTRPC();
  // const { data: users } = useQuery(trpc.getUsers.queryOptions());
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      {/* {JSON.stringify(users)} */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p>Loading...</p>}>
          <Client />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
};
export default Page;
