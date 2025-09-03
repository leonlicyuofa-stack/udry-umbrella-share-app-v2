import Image from 'next/image';

export default function ScreenshotMapPage() {
  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
        <h1 className="absolute top-16 text-3xl font-bold text-primary z-10 text-center drop-shadow-lg">
            Find an Umbrella Anywhere
        </h1>
        <p className="absolute top-28 text-md text-muted-foreground z-10 text-center drop-shadow-md max-w-xs">
            Hundreds of stalls available across the city.
        </p>
        <div className="absolute inset-0 z-0">
            <Image
                src="https://picsum.photos/1200/1800"
                alt="City map with location pins"
                fill
                className="object-cover"
                data-ai-hint="map city"
            />
        </div>
        <div className="absolute bottom-8 text-center text-xs text-white/50 z-10">
            <p>Screenshot for U-Dry App Store Listing</p>
        </div>
    </div>
  );
}
