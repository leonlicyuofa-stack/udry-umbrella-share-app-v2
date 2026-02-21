
"use client"; // Added to ensure this page is a Client Component

import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

// Note: Metadata export is fine in a client component, Next.js handles it.
// Removed static metadata export as it conflicts with "use client"
// export const metadata: Metadata = {
//   title: 'Sign Up - U-Dry',
//   description: 'Create a new U-Dry account.',
// };

export default function SignUpPage() {
  const { translate } = useLanguage();
  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{translate('create_account_title')}</CardTitle>
        <CardDescription>{translate('signup_form_description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
    </Card>
  );
}
