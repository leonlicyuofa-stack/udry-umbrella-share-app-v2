
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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";

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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} type="email" disabled={isLoading} />
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
                  <FormLabel>Password</FormLabel>
                  <Button variant="link" asChild className="px-0.5 h-auto text-xs">
                     <a href="https://wa.me/85297373875" target="_blank" rel="noopener noreferrer">
                        Forgot password?
                     </a>
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
            Sign In
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground pt-4">
        Don&apos;t have an account?{' '}
        <Button variant="link" asChild className="px-0.5">
          <Link href="/auth/signup">Sign up</Link>
        </Button>
      </p>
    </div>
  );
}
