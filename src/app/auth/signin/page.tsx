"use client"; // Added to ensure this page is a Client Component

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

// Note: Metadata export is fine in a client component, Next.js handles it.
// Removed static metadata export as it conflicts with "use client"
// export const metadata: Metadata = {
//   title: 'Sign In - U-Dry',
//   description: 'Sign in to your U-Dry account.',
// };

export default function SignInPage() {
  const { translate } = useLanguage();
  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{translate('welcome_back_title')}</CardTitle>
        <CardDescription>{translate('signin_form_description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
    </Card>
  );
}
