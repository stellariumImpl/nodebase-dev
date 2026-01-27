"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Field,
  FieldGroup,
  FieldDescription,
  FieldSeparator,
} from "@/components/ui/field";

// import { GalleryVerticalEnd } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { LoginRegisterButton } from "@/components/login-register-button";
import { AuthInput } from "./auth-input";

import { Loader } from "@/components/ui/loader";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // NOTE: Actually, isPending not just depends on form.formState.isSubmitting
  // 为了防止loader加载完后，还有短暂的时间留在form界面里，所以用isNavigating来控制loader的显示
  // const isPending = form.formState.isSubmitting;
  const isPending = form.formState.isSubmitting || isNavigating;
  // NOTE: prefetch the home page to reduce the time to the home page
  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  const signInGithub = async () => {
    setIsNavigating(true);
    await authClient.signIn.social(
      {
        provider: "github",
        callbackURL: "/", // 指定回调URL，避免跳转到登录页面
      },
      {
        onSuccess: () => {
          // 如果成功，页面会自动跳转，这里不需要额外处理
        },
        onError: (ctx) => {
          setIsNavigating(false);
          toast.error(ctx.error.message);
        },
      },
    );
  };

  const singInGoogle = async () => {
    setIsNavigating(true);
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/", // 指定回调URL，避免跳转到登录页面
      },
      {
        onSuccess: () => {
          // 如果成功，页面会自动跳转，这里不需要额外处理
        },
        onError: (ctx) => {
          setIsNavigating(false);
          toast.error(ctx.error.message);
        },
      },
    );
  };

  const onSubmit = async (values: RegisterFormValues) => {
    await authClient.signUp.email(
      {
        name: values.email,
        email: values.email,
        password: values.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          // router.push("/");
          setIsNavigating(true);
          router.replace("/");
        },
        onError: (ctx) => {
          setIsNavigating(false);
          toast.error(ctx.error.message);
        },
      },
    );
  };

  return (
    <>
      {isPending && <Loader variant="fullscreen" />}
      <div className="flex flex-col gap-6 mx-auto w-full max-w-sm sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              {/* Logo + Title */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md">
                    {/* <GalleryVerticalEnd className="size-6" /> */}
                    <Logo
                      size={48}
                      className="text-orange-500 dark:text-orange-400"
                    />
                  </div>
                </div>
                <h1 className="text-xl font-bold">Welcome to Nodebase</h1>
                <FieldDescription>
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </FieldDescription>
              </div>

              {/* Email */}
              <Field>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <AuthInput
                          type="email"
                          placeholder="m@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* Password */}
              <Field>
                <FormField
                  control={form.control}
                  name="password"
                  rules={{ deps: ["confirmPassword"] }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <AuthInput type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* Confirm Password */}
              <Field>
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  rules={{ deps: ["password"] }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <AuthInput type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* Submit */}
              <Field>
                <LoginRegisterButton
                  disabled={isPending}
                  type="submit"
                  className="w-full"
                >
                  Sign up
                </LoginRegisterButton>
              </Field>

              {/* Or separator */}
              <FieldSeparator>Or</FieldSeparator>

              {/* Social Buttons */}
              <Field className="grid gap-4 sm:grid-cols-2">
                <Button
                  disabled={isPending}
                  onClick={singInGoogle}
                  variant="outline"
                  size="lg"
                  className="w-full font-medium text-sm gap-3"
                  type="button"
                >
                  <FcGoogle className="size-5" />
                  Continue with Google
                </Button>

                <Button
                  disabled={isPending}
                  onClick={signInGithub}
                  variant="outline"
                  size="lg"
                  className="w-full font-medium text-sm gap-3"
                  type="button"
                >
                  <FaGithub className="size-5" />
                  Continue with Github
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </Form>

        {/* <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription> */}
      </div>
    </>
  );
}
