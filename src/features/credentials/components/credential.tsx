"use client";

import { CredentialType } from "@/generated/prisma/enums";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
  useCreateCredential,
  useUpdateCredential,
  useSuspenseCredential,
} from "../hooks/use-credentials";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(CredentialType),
  value: z.string().min(1, "API key is required"),
});

type FormValues = z.infer<typeof formSchema>;

const credentialTypeOptions = [
  {
    value: CredentialType.OPENAI,
    label: "OpenAI",
    logo: "/logos/openai.svg",
    placeholder: "sk-...",
  },
  {
    value: CredentialType.ANTHROPIC,
    label: "Anthropic",
    logo: "/logos/anthropic.svg",
    placeholder: "sk-ant-...",
  },
  {
    value: CredentialType.DEEPSEEK,
    label: "Deepseek",
    logo: "/logos/deepseek.svg",
    placeholder: "sk-...",
  },
  {
    value: CredentialType.GEMINI,
    label: "Gemini",
    logo: "/logos/gemini.svg",
    placeholder: "AIza...",
  },
];

interface CredentialFormProps {
  initialData?: {
    id?: string;
    name: string;
    type: CredentialType;
    value: string;
  };
}

export const CredentialForm = ({ initialData }: CredentialFormProps) => {
  const router = useRouter();
  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();
  const { handleError, modal } = useUpgradeModal();

  const isEdit = !!initialData?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      type: CredentialType.OPENAI,
      value: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedType = form.watch("type");

  // 根据选择的类型获取相应的占位符
  const getPlaceholder = () => {
    const option = credentialTypeOptions.find(
      (opt) => opt.value === selectedType,
    );
    return option?.placeholder || "API Key";
  };

  const onSubmit = async (values: FormValues) => {
    if (isSubmitting) return; // 防止重复提交

    setIsSubmitting(true);

    try {
      //   if (isEdit) {
      //     await updateCredential.mutateAsync(
      //       { id: initialData.id!, ...values },
      //       {
      //         onSuccess: () => {
      //           router.push(`/credentials`);
      //         },
      //       },
      //     );
      //   } else {
      //     await createCredential.mutateAsync(values, {
      //       onSuccess: (data) => {
      //         router.push(`/credentials/${data.id}`);
      //       },
      //     });
      //   }
      if (isEdit) {
        await updateCredential.mutateAsync({ id: initialData.id!, ...values });
        router.push("/credentials");
      } else {
        await createCredential.mutateAsync(values);
        router.push("/credentials");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit" : "Create"} Credential
        </h1>
        <p className="text-muted-foreground">
          {isEdit
            ? "Update your credential settings"
            : "Add a new credential to use in your workflows"}
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 bg-background rounded-lg p-6 border"
        >
          <div className="grid gap-6 md:grid-cols-2">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My API Key"
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type Field */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {credentialTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Image
                              src={option.logo}
                              alt={option.label}
                              width={16}
                              height={16}
                              className="rounded-sm"
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* API Key Field - Full Width */}
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">API Key</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={getPlaceholder()}
                    autoComplete="off"
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
            <Button
              asChild
              variant="outline"
              disabled={form.formState.isSubmitting}
              className="sm:w-auto w-full"
            >
              <Link href="/credentials" prefetch>
                Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="sm:w-auto w-full"
            >
              {form.formState.isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </form>
      </Form>
      {modal}
    </div>
  );
};

export const CredentialView = ({ credentialId }: { credentialId: string }) => {
  const params = useParams();
  //   const credentialId = params.credentialId as string;
  const { data: credential } = useSuspenseCredential(credentialId);

  return <CredentialForm initialData={credential} />;
};
