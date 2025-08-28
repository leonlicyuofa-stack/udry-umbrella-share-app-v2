// src/components/map/map-page-client.tsx
"use client";

import { MapDisplay } from '@/components/map/map-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { APIProvider } from '@vis.gl/react-google-maps';
import { cn } from '@/lib/utils';

function GoogleMapsConfigError() {
  const { translate } = useLanguage();
  return (
    <Alert variant="destructive" className="max-w-3xl mx-auto my-8">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{translate('map_config_error_title')}</AlertTitle>
      <AlertDescription>
        <p className="mb-2 font-semibold">{translate('map_config_error_missing_key')}</p>
        <ul className="list-disc pl-5 space-y-2 text-xs">
          <li>{translate('map_config_error_dev_instructions')}</li>
          <li>{translate('map_config_error_deploy_instructions')}</li>
          <li>{translate('map_config_error_key_format')}</li>
          <li>{translate('map_config_error_restart_needed')}</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}


export function MapPageClient() {
  const { translate } = useLanguage();
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "YOUR_KEY_HERE" || apiKey.trim() === "") {
      console.error("Google Maps API Key is missing or is a placeholder.");
      setIsApiKeyMissing(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
      return (
        <div className="container mx-auto py-8 px-4 text-center">
            <p>{translate('map_checking_api_key')}</p>
        </div>
      );
  }

  if (isApiKeyMissing) {
    return (
      <div className="container mx-auto py-8 px-4">
        <GoogleMapsConfigError />
      </div>
    );
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <section>
          <Card className={cn("shadow-lg")}>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">{translate('find_an_umbrella_title')}</CardTitle>
              <CardDescription>
                {translate('find_an_umbrella_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MapDisplay />
            </CardContent>
          </Card>
        </section>
      </div>
    </APIProvider>
  );
}
