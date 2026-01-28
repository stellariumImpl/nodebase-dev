import { requireAuth } from "@/lib/auth-utils";
import { prefetchWorkflow } from "@/features/workflows/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import {
  Editor,
  EditorError,
  EditorLoading,
} from "@/features/editor/components/editor";
import { EditorHeader } from "@/features/editor/components/editor-header";

interface PageProps {
  params: Promise<{
    workflowId: string;
  }>;
}

// http://localhost:3000/workflows/123

const Page = async ({ params }: PageProps) => {
  await requireAuth();
  const { workflowId } = await params;
  prefetchWorkflow(workflowId);
  return (
    <HydrateClient>
      <ErrorBoundary fallback={<EditorError />}>
        <Suspense fallback={<EditorLoading />}>
          {/* 1. 关键：外层增加一个 flex-col 容器，强制占据整个视口高度 */}
          <div className="flex flex-col h-screen w-full overflow-hidden">
            <EditorHeader workflowId={workflowId} />

            {/* 3. 主体：flex-1 会自动填满除去 Header 后的所有剩余高度 */}
            {/* min-h-0 是 Flex 布局的黑科技，防止内容撑破容器 */}
            <main className="flex-1 min-h-0 relative">
              <Editor workflowId={workflowId} />
            </main>
          </div>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default Page;
