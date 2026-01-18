import { requireAuth } from "@/lib/auth-utils";
import {
  WorkflowsContainer,
  WorkflowsList,
} from "@/features/workflows/components/workflows";
import { HydrateClient } from "@/trpc/server";
import { prefetchWorkflows } from "@/features/workflows/server/prefetch";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

const Page = async () => {
  await requireAuth();
  prefetchWorkflows();
  return (
    <WorkflowsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<p>Error!</p>}>
          <Suspense fallback={<p>Loading...</p>}>
            <WorkflowsList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </WorkflowsContainer>
  );
};

export default Page;
