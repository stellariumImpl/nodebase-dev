import { useTRPC } from "@/trpc/client";
import {
  useQueryClient,
  useSuspenseQuery,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useExecutionsParams } from "./use-executions-params";
import { CredentialType } from "@/generated/prisma/enums";
/**
 * Hook to fetch all executions using suspense
 */

export const useSuspenseExecutions = () => {
  const trpc = useTRPC();

  // Extract the params from useExecutionsParams() TODO:
  const [params] = useExecutionsParams();

  return useSuspenseQuery(trpc.executions.getMany.queryOptions(params));
};

/**
 * Hook to fetch a single execution using suspense
 */
export const useSuspenseExecution = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.executions.getOne.queryOptions({ id }));
};
