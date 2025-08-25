
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';
import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TermsAndConditionsPage() {
  const { translate } = useLanguage();
  const [lastUpdatedDate, setLastUpdatedDate] = useState('');

  useEffect(() => {
    // Simulate fetching or setting a dynamic date if needed, for now, static
    // Using a fixed date string to avoid hydration issues with new Date().toLocaleDateString() directly in initial state
    setLastUpdatedDate('2024-06-15'); // Example date
  }, []);


  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <FileText className="mr-3 h-8 w-8" />
            {translate('terms_content_title')}
          </CardTitle>
          <CardDescription>
            {translate('terms_last_updated')} {lastUpdatedDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScrollArea className="h-[60vh] p-1 pr-3">
            <div className="space-y-6 text-sm text-foreground/80">
              <h2 className="text-xl font-semibold text-primary mt-4">{translate('terms_section_1_title')}</h2>
              <p>{translate('terms_section_1_content')}</p>
              
              <Separator />

              <h2 className="text-xl font-semibold text-primary mt-4">{translate('terms_section_2_title')}</h2>
              <p>{translate('terms_section_2_content_p1')}</p>
              {/* Removed text-destructive/80 from the className below */}
              <p className="font-semibold">{translate('terms_section_2_content_p2')}</p>

              <Separator />

              <h2 className="text-xl font-semibold text-primary mt-4">{translate('terms_section_3_title')}</h2>
              <p>{translate('terms_section_3_content')}</p>

              <Separator />

              <h2 className="text-xl font-semibold text-primary mt-4">{translate('terms_section_4_title')}</h2>
              <p>{translate('terms_section_4_content')}</p>

              <Separator />

              <h2 className="text-xl font-semibold text-primary mt-4">{translate('terms_section_5_title')}</h2>
              <p>{translate('terms_section_5_content')}</p>

              <Separator />
              
              <h2 className="text-xl font-semibold text-primary mt-4">{translate('terms_section_6_title')}</h2>
              <p>{translate('terms_section_6_content')}</p>

            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
