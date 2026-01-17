"use client";

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
import { toast } from "sonner";
import { LoginRegisterButton } from "@/components/login-register-button";
import { AuthInput } from "./auth-input";

import { Loader } from "@/components/ui/loader";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isPending = form.formState.isSubmitting;

  const onSubmit = async (values: LoginFormValues) => {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          router.push("/");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      }
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
                    <Logo className="text-orange-500 dark:text-orange-400" />
                  </div>
                </div>
                <h1 className="text-xl font-bold">Welcome to Nodebase</h1>
                <FieldDescription>
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-medium underline underline-offset-4"
                  >
                    Sign up
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

              {/* Submit */}
              <Field>
                <LoginRegisterButton
                  disabled={isPending}
                  type="submit"
                  className="w-full"
                >
                  Login
                </LoginRegisterButton>
              </Field>

              {/* Or separator */}
              <FieldSeparator>Or</FieldSeparator>

              {/* Social Buttons */}
              <Field className="grid gap-4 sm:grid-cols-2">
                <Button
                  disabled={isPending}
                  onClick={() => {}}
                  variant="outline"
                  size="lg"
                  className="w-full relative font-medium"
                  type="button"
                >
                  <FcGoogle className="size-5 absolute left-3" />
                  Continue with Google
                </Button>

                <Button
                  disabled={isPending}
                  onClick={() => {}}
                  variant="outline"
                  size="lg"
                  className="w-full relative font-medium"
                  type="button"
                >
                  <FaGithub className="size-5 absolute left-3" />
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
