
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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function SignUpForm() {
  const { signUpWithEmail, loading: authLoading } = useAuth();
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} disabled={isLoading} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" {...field} type="password" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground pt-4">
        Already have an account?{' '}
        <Button variant="link" asChild className="px-0.5">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </p>
    </div>
  );
}
