"use client";

import { formatDistanceToNow } from "date-fns";
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
  useRemoveCredential,
  useSuspenseCredentials,
} from "../hooks/use-credentials";
import { useRouter } from "next/navigation";
import { useCredentialsParams } from "../hooks/use-credentials-params";
import { useEntitySearch } from "../hooks/use-entity-search";
import { useEffect, useState } from "react";
import Image from "next/image";

import type { CredentialModel as Credential } from "@/generated/prisma/models/Credential";
import { CredentialType } from "@/generated/prisma/enums";

export const CredentialsSearch = () => {
  const [params, setParams] = useCredentialsParams();
  // 解构出 isSearching (来自 useTransition 的 isPending)
  const { searchValue, onSearchChange, isSearching } = useEntitySearch({
    params,
    setParams,
  });
  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search credentials"
      isSearching={isSearching}
    />
  );
};

export const CredentialsList = () => {
  //   throw new Error("only for test");
  const credentials = useSuspenseCredentials();

  // 获取当前的 url 参数
  const [params] = useCredentialsParams();

  // 如果 search 有值且不为空字符串，说明用户正在搜索
  const isSearching = !!params.search && params.search.length > 0;

  if (credentials.isFetching) {
    return <CredentialsLoading />;
  }

  if (credentials.data.items.length === 0) {
    return <CredentialsEmpty isSearching={isSearching} />;
  }

  return (
    <EntityList
      items={credentials.data.items}
      getKey={(credential) => credential.id}
      renderItem={(credential) => <CredentialItem data={credential} />}
      emptyView={<CredentialsEmpty isSearching={isSearching} />}
    />
  );
};

export const CredentialsHeaders = ({ disabled }: { disabled?: boolean }) => {
  return (
    <EntityHeader
      title="Credentials"
      description="Create and manage your credentials"
      newButtonHref="/credentials/new"
      newButtonLabel="New Credential"
      disabled={disabled}
    />
  );
};

export const CredentialsPagination = () => {
  const credentials = useSuspenseCredentials();
  const [params, setParams] = useCredentialsParams();
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return (
    <EntityPagination
      //   disabled={credentials.isFetching}
      disabled={hasHydrated ? credentials.isFetching : false}
      totalPages={credentials.data.totalPages}
      page={credentials.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const CredentialsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<CredentialsHeaders />}
      search={<CredentialsSearch />}
      pagination={<CredentialsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const CredentialsLoading = () => {
  return <LoadingView message="Loading credentials..." />;
};

export const CredentialsError = () => {
  return <ErrorView message="Error loading credentials" />;
};

export const CredentialsEmpty = ({
  isSearching,
}: {
  isSearching?: boolean;
}) => {
  const router = useRouter();

  const handleCreateCredential = () => {
    router.push(`/credentials/new`);
  };

  // 文案切换
  const message = isSearching
    ? "No credentials found matching your search." // 搜索无结果
    : "You haven't created any credentials yet. Get started by creating your first credential"; // 初始无数据

  return <EmptyView onNew={handleCreateCredential} message={message} />;
};

const credentialLogos: Record<CredentialType, string> = {
  [CredentialType.OPENAI]: "/logos/openai.svg",
  [CredentialType.DEEPSEEK]: "/logos/deepseek.svg",
  [CredentialType.ANTHROPIC]: "/logos/anthropic.svg",
  [CredentialType.GEMINI]: "/logos/gemini.svg",
};

export const CredentialItem = ({ data }: { data: Credential }) => {
  const removeCredential = useRemoveCredential();
  const handleRemove = () => {
    removeCredential.mutate({ id: data.id });
  };
  const logo = credentialLogos[data.type] || "/logos/openai.svg";
  return (
    <EntityItem
      href={`/credentials/${data.id}`}
      title={data.name}
      subtitle={
        <>
          Updated {formatDistanceToNow(data.updatedAt)} &bull; Created{" "}
          {formatDistanceToNow(data.createdAt)}
        </>
      }
      image={
        <div className="size-8 flex items-center justify-center">
          <Image src={logo} alt={data.type} width={20} height={20} />
        </div>
      }
      onRemove={handleRemove}
      isRemoving={removeCredential.isPending}
    />
  );
};
