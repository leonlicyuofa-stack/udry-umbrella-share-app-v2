
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
import { signUpSchema, type SignUpFormData } from "@/lib/types";
import { Loader2, Info } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SocialLoginButtons } from "./social-login-buttons";
import { useLanguage } from "@/contexts/language-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SignUpForm() {
  const { signUpWithEmail, loading: authLoading } = useAuth();
  const { translate } = useLanguage();
  const [formLoading, setFormLoading] = useState(false);
  const isLoading = authLoading || formLoading;

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignUpFormData) {
    setFormLoading(true);
    try {
      await signUpWithEmail(values);
      // Redirect is handled by AuthLayout or page
    } catch (error) {
      // Error is handled by toast in AuthContext
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{translate('auth_consistency_warning_title')}</AlertTitle>
        <AlertDescription>
          {translate('auth_consistency_warning_desc')}
        </AlertDescription>
      </Alert>

      <SocialLoginButtons />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {translate('or_continue_with')}
          </span>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translate('name_label')}</FormLabel>
                <FormControl>
                  <Input placeholder={translate('name_placeholder')} {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translate('email_label')}</FormLabel>
                <FormControl>
                  <Input placeholder={translate('email_placeholder')} {...field} type="email" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translate('password_label')}</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" {...field} type="password" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {translate('signup_button')}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground pt-4">
        {translate('already_have_account_prompt')}{' '}
        <Button variant="link" asChild className="px-0.5">
          <Link href="/auth/signin">{translate('login')}</Link>
        </Button>
      </p>
    </div>
  );
}
