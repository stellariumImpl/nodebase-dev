import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useExecutionsParams } from "./use-executions-params";
import { useMemo } from "react";
import { ExecutionStatus } from "@/generated/prisma/enums";
/**
 * Hook to fetch all executions using suspense
 */

export const useSuspenseExecutions = () => {
  const trpc = useTRPC();

  // Extract the params from useExecutionsParams() TODO:
  const [params] = useExecutionsParams();

  const queryOptions = useMemo(
    () => trpc.executions.getMany.queryOptions(params),
    [params, trpc.executions],
  );

  return useSuspenseQuery({
    ...queryOptions,
    refetchInterval: 500,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

/**
 * Hook to fetch a single execution using suspense
 */
export const useSuspenseExecution = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.executions.getOne.queryOptions({ id }));
};
