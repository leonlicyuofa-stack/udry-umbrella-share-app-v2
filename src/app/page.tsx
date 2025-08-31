// This is the root page of the application.
// It displays a loading indicator while the AuthProvider in the root layout
// handles the initial authentication check and redirects the user.
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
