import { LoginForm } from "@/features/auth/components/login-form";
import { requireUnauth } from "@/lib/auth-utils";
import { ThemeSwitcher } from "@/components/theme-switcher";

const Page = async () => {
  await requireUnauth();
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <LoginForm />
    </div>
  );
};

export default Page;

// http://localhost:3000/login
// although the page.tsx is in login directory under (auth), no need to add (auth) in the url
