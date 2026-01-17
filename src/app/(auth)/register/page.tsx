import { RegisterForm } from "@/features/auth/components/register-form";
import { requireUnauth } from "@/lib/auth-utils";
import { ThemeSwitcher } from "@/components/theme-switcher";

const Page = async () => {
  await requireUnauth();
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <RegisterForm />
    </div>
  );
};

export default Page;
