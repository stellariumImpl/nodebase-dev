import { CredentialView } from "@/features/credentials/components/credential";
import { requireAuth } from "@/lib/auth-utils";
import { prefetchCredential } from "@/features/credentials/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import {
  CredentialsError,
  CredentialsLoading,
} from "@/features/credentials/components/credentials";

interface PageProps {
  params: Promise<{
    credentialId: string;
  }>;
}

// http://localhost:3000/credentials/123

const Page = async ({ params }: PageProps) => {
  await requireAuth();
  const { credentialId } = await params;
  prefetchCredential(credentialId);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6">
      {/* Page Header */}
      <div className="space-y-2" />
      {/* Content */}
      <HydrateClient>
        <ErrorBoundary fallback={<CredentialsError />}>
          <Suspense fallback={<CredentialsLoading />}>
            <CredentialView credentialId={credentialId} />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </div>
  );
};

export default Page;
