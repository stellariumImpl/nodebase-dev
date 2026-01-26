import { createTRPCRouter } from "../init";
import { WorkflowsRouter } from "@/features/workflows/server/routers";
import { CredentialsRouter } from "@/features/credentials/server/routers";
import { ExecutionsRouter } from "@/features/executions/server/routers";

export const appRouter = createTRPCRouter({
  workflows: WorkflowsRouter,
  credentials: CredentialsRouter,
  executions: ExecutionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
