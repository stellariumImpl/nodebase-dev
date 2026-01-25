import { createTRPCRouter } from "../init";
import { WorkflowsRouter } from "@/features/workflows/server/routers";
import { CredentialsRouter } from "@/features/credentials/server/routers";

export const appRouter = createTRPCRouter({
  workflows: WorkflowsRouter,
  credentials: CredentialsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
