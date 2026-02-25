"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { sendPasswordReset } = useAuth();
  const { translate } = useLanguage();
  const [formLoading, setFormLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormData) {
    setFormLoading(true);
    try {
      await sendPasswordReset(values.email);
      // The toast is now handled within the sendPasswordReset function
      setIsSubmitted(true);
    } catch (error) {
      // Errors are now handled by a toast within the sendPasswordReset function
      console.error("Forgot password submission error:", error);
    } finally {
      setFormLoading(false);
    }
  }

  if (isSubmitted) {
    return (
        <div className="text-center space-y-4">
            <Mail className="mx-auto h-12 w-12 text-primary" />
            <h3 className="text-xl font-semibold">{translate('forgot_password_sent_title')}</h3>
            <p className="text-muted-foreground">{translate('forgot_password_sent_desc')}</p>
            <Button variant="outline" asChild>
                <Link href="/auth/signin">{translate('forgot_password_back_to_signin')}</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translate('email_label')}</FormLabel>
                <FormControl>
                  <Input placeholder={translate('email_placeholder')} {...field} type="email" disabled={formLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={formLoading}>
            {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {translate('forgot_password_submit_button')}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground pt-4">
        {translate('forgot_password_remembered')}{' '}
        <Button variant="link" asChild className="px-0.5">
          <Link href="/auth/signin">{translate('signin_button')}</Link>
        </Button>
      </p>
    </div>
  );
}
