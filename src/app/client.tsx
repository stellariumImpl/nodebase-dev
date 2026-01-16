// COPY from page.tsx & MODIFY
"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

export const Client = () => {
  // const Page = async () => {
  // const users = await prisma.user.findMany();
  // const users = await caller.getUsers(); // NOTE: import "server-only";
  // Here is the client way for tRPC
  const trpc = useTRPC();
  //   const { data: users } = useQuery(trpc.getUsers.queryOptions());
  const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions());
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      Client component: {JSON.stringify(users)}
    </div>
  );
};
