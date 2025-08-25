
"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

// Placeholder SVG for Apple logo (replace with a proper one if available)
const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.51,15.68a5.75,5.75,0,0,1-1.09.25,5.89,5.89,0,0,1-2.36-.48,4.14,4.14,0,0,0-1.53-.4,4.46,4.46,0,0,0-2,.53,6.2,6.2,0,0,0-1.45,2.06,8.08,8.08,0,0,0,.6,3.28,5.66,5.66,0,0,0,2.3,1.79,4.58,4.58,0,0,0,2.71.24,5.32,5.32,0,0,0,2.48-1.48A10.84,10.84,0,0,1,19.51,15.68ZM16.13,5.18A4.69,4.69,0,0,0,14.3,2.57,5.17,5.17,0,0,0,11.39,4a4.48,4.48,0,0,0,1.74,3.34A4.72,4.72,0,0,0,16.13,8.1,4.92,4.92,0,0,0,19,6.45,4.87,4.87,0,0,0,16.13,5.18Z" />
  </svg>
);

// Simple Google G Logo SVG
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);


export function SocialLoginButtons({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) {
  const { signInWithGoogle, signInWithApple, loading } = useAuth();

  const handleGoogleSignIn = async () => {
    onLoadingChange?.(true);
    await signInWithGoogle();
    onLoadingChange?.(false);
  };

  const handleAppleSignIn = async () => {
    onLoadingChange?.(true);
    await signInWithApple();
    onLoadingChange?.(false);
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-5 w-5" />
        )}
        Continue with Google
      </Button>
      <Button
        variant="outline"
        className="w-full bg-black text-white hover:bg-gray-800 hover:text-white"
        onClick={handleAppleSignIn}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <AppleIcon className="mr-2 h-5 w-5" />
        )}
        Continue with Apple
      </Button>
    </div>
  );
}
