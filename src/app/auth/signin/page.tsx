"use client"; // Added to ensure this page is a Client Component

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Note: Metadata export is fine in a client component, Next.js handles it.
// Removed static metadata export as it conflicts with "use client"
// export const metadata: Metadata = {
//   title: 'Sign In - U-Dry',
//   description: 'Sign in to your U-Dry account.',
// };

export default function SignInPage() {
  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back!</CardTitle>
        <CardDescription>TESTING Sign in to access your account and manage your U-Dry rentals.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
    </Card>
  );
}
