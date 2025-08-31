// src/app/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// This is now a Server Component. Its only job is to handle the initial redirect.
// It checks for a Firebase auth cookie to make an educated guess about the user's status.
// The final auth state is still definitively handled by the client-side AuthProvider.
export default function RootPage() {
  const cookieStore = cookies();
  // Firebase Auth sets a cookie when a user is signed in. We check for its existence.
  // The cookie name is complex, but it always contains "firebase" and "user".
  const hasAuthCookie = cookieStore.getAll().some(cookie => cookie.name.includes('firebase') && cookie.name.includes('user'));

  if (hasAuthCookie) {
    // If the cookie exists, we assume the user is logged in and redirect to the main app page.
    redirect('/home');
  } else {
    // If no auth cookie, redirect to the sign-in page.
    redirect('/auth/signin');
  }

  // This component will never actually render anything, as it always redirects.
  return null;
}
