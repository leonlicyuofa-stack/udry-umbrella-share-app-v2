
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
import { signInSchema, type SignInFormData } from "@/lib/types";
import { Loader2, Info } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { SocialLoginButtons } from "./social-login-buttons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SignInForm() {
  const { signInWithEmail, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [formLoading, setFormLoading] = useState(false);
  const isLoading = authLoading || formLoading;

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInFormData) {
    setFormLoading(true);
    try {
      await signInWithEmail(values);
      // On success, redirect is handled by AuthContext's useEffect
    } catch (error: any) {
      // On failure, handle the error.
      if (error.code === 'auth/invalid-credential') {
        // Use react-hook-form's setError to display an inline message
        form.setError("password", { 
          type: "manual", 
          message: translate('auth_error_invalid_credential_desc') 
        });
      } else {
        // For other, unexpected errors, show a generic toast.
        toast({ 
          variant: 'destructive', 
          title: translate('auth_error_signin_email_failed'), 
          description: error.message 
        });
      }
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
                <div className="flex items-center justify-between">
                  <FormLabel>{translate('password_label')}</FormLabel>
                  <Button variant="link" asChild className="px-0.5 h-auto text-xs">
                    <Link href="/auth/forgot-password">
                      {translate('forgot_password_link')}
                    </Link>
                  </Button>
                </div>
                <FormControl>
                  <Input placeholder="••••••••" {...field} type="password" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {translate('signin_button')}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground pt-4">
        {translate('dont_have_account_prompt')}{' '}
        <Button variant="link" asChild className="px-0.5">
          <Link href="/auth/signup">{translate('signup')}</Link>
        </Button>
      </p>
    </div>
  );
}
