import { RegisterForm } from "@/features/auth/components/register-form";
import { requireUnauth } from "@/lib/auth-utils";

const Page = async () => {
  await requireUnauth();
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
};

export default Page;
