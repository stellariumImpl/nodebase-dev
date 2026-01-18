import { createTRPCRouter } from "../init";
import { WorkflowsRouter } from "@/features/workflows/server/routers";

export const appRouter = createTRPCRouter({
  workflows: WorkflowsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
