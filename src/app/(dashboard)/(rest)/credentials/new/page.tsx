import { requireAuth } from "@/lib/auth-utils";
import { CredentialForm } from "@/features/credentials/components/credential";

const Page = async () => {
  await requireAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6">
      {/* Page Header */}
      <div className="space-y-2" />
      <CredentialForm />
    </div>
  );
};

export default Page;
