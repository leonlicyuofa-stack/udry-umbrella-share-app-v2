import { AppLogo } from '@/components/layout/app-logo';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export default function ScreenshotWelcomePage() {
  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-primary/5 p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/1200/1800"
          alt="Rainy day in the city"
          fill
          className="object-cover opacity-20"
          data-ai-hint="rain city"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <AppLogo />
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          Never get caught in the rain again.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md">
          Your smart umbrella sharing solution. Find, rent, and return with ease.
        </p>
      </div>

      <div className="absolute bottom-8 text-center text-xs text-muted-foreground/50">
        <p>Screenshot for U-Dry App Store Listing</p>
      </div>
    </div>
  );
}
