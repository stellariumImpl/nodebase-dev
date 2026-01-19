"use client";

import {
  EntityHeader,
  EntityContainer,
  EntitySearch,
  EntityPagination,
  LoadingView,
  ErrorView,
  EmptyView,
  EntityList,
  EntityItem,
} from "@/components/entity-components";
import {
  useCreateWorkflow,
  useSuspenseWorkflows,
} from "../hooks/use-workflows";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useRouter } from "next/navigation";
import { useWorkflowsParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "../hooks/use-entity-search";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { WorkflowIcon } from "lucide-react";

import type { WorkflowModel as Workflow } from "@/generated/prisma/models/Workflow";

export const WorkflowSearch = () => {
  const [params, setParams] = useWorkflowsParams();
  // 解构出 isSearching (来自 useTransition 的 isPending)
  const { searchValue, onSearchChange, isSearching } = useEntitySearch({
    params,
    setParams,
  });
  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search workflows"
      isSearching={isSearching}
    />
  );
};

export const WorkflowsList = () => {
  //   throw new Error("only for test");
  const workflows = useSuspenseWorkflows();

  // 获取当前的 url 参数
  const [params] = useWorkflowsParams();

  // 如果 search 有值且不为空字符串，说明用户正在搜索
  const isSearching = !!params.search && params.search.length > 0;

  return (
    <EntityList
      items={workflows.data.items}
      getKey={(workflow) => workflow.id}
      renderItem={(workflow) => <WorkflowItem data={workflow} />}
      emptyView={<WorkflowsEmpty isSearching={isSearching} />}
    />
  );
};

export const WorkflowsHeader = ({ disabled }: { disabled?: boolean }) => {
  const createWorkflow = useCreateWorkflow();

  const { handleError, modal } = useUpgradeModal();

  const router = useRouter();

  const handleCreateWorkflow = () => {
    createWorkflow.mutate(undefined, {
      // 如果不想创建成功后跳转到详情页，可以注释掉onSuccess
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`);
      },
      onError: (error) => {
        // TODO: open upgrade modal
        // console.error(error);
        handleError(error);
      },
    });
  };

  return (
    <>
      {modal}
      <EntityHeader
        title="Workflows"
        description="Create and manage your workflows"
        onNew={handleCreateWorkflow}
        newButtonLabel="New Workflow"
        disabled={disabled}
        isCreating={createWorkflow.isPending}
      />
    </>
  );
};

export const WorkflowsPagination = () => {
  const workflows = useSuspenseWorkflows();
  const [params, setParams] = useWorkflowsParams();
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return (
    <EntityPagination
      //   disabled={workflows.isFetching}
      disabled={hasHydrated ? workflows.isFetching : false}
      totalPages={workflows.data.totalPages}
      page={workflows.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const WorkflowsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<WorkflowsHeader />}
      search={<WorkflowSearch />}
      pagination={<WorkflowsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const WorkflowsLoading = () => {
  return <LoadingView message="Loading workflows..." />;
};

export const WorkflowsError = () => {
  return <ErrorView message="Error loading workflows" />;
};

export const WorkflowsEmpty = ({ isSearching }: { isSearching?: boolean }) => {
  const createWorkflow = useCreateWorkflow();
  const { handleError, modal } = useUpgradeModal();
  const router = useRouter();

  const handleCreateWorkflow = () => {
    createWorkflow.mutate(undefined, {
      onSuccess: (data) => {
        router.push(`/workflows`);
      },
      onError: (error) => {
        handleError(error);
      },
    });
  };

  // 文案切换
  const message = isSearching
    ? "No workflows found matching your search." // 搜索无结果
    : "You haven't created any workflows yet. Get started by creating your first workflow"; // 初始无数据

  return (
    <>
      {modal}
      <EmptyView onNew={handleCreateWorkflow} message={message} />
    </>
  );
};

export const WorkflowItem = ({ data }: { data: Workflow }) => {
  return (
    <EntityItem
      href={`/workflows/${data.id}`}
      title={data.name}
      subtitle={<>Updated TODO &bull; Created TODO</>}
      image={
        <div className="size-8 flex items-center justify-center">
          <WorkflowIcon className="size-5 text-muted-foreground" />
        </div>
      }
      onRemove={() => {}}
      isRemoving={false}
    />
  );
};
