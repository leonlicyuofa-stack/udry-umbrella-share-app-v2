
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
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();
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
    // NOTE: The actual Firebase logic will be added in Step 2.
    // This is a placeholder to simulate the UI behavior.
    console.log("Password reset requested for:", values.email);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Check Your Email",
      description: `If an account exists for ${values.email}, a password reset link has been sent.`,
    });
    setIsSubmitted(true);
    setFormLoading(false);
  }

  if (isSubmitted) {
    return (
        <div className="text-center space-y-4">
            <Mail className="mx-auto h-12 w-12 text-primary" />
            <h3 className="text-xl font-semibold">Request Sent</h3>
            <p className="text-muted-foreground">Please check your inbox for a link to reset your password. If you don't see it, check your spam folder.</p>
            <Button variant="outline" asChild>
                <Link href="/auth/signin">Back to Sign In</Link>
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} type="email" disabled={formLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={formLoading}>
            {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground pt-4">
        Remembered your password?{' '}
        <Button variant="link" asChild className="px-0.5">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </p>
    </div>
  );
}
