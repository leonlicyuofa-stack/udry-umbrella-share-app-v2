import { GuideContent } from '@/components/guide/guide-content';
import type { Metadata } from 'next';

// Note: Translations cannot be directly used in server component metadata in a simple way.
// Static text is used here. For dynamic titles based on language, client-side updates
// or more complex i18n routing strategies would be needed.
export const metadata: Metadata = {
  title: 'User Guide - U-Dry',
  description: 'Learn how to use the U-Dry service, from finding stalls to renting and returning umbrellas.',
};

export default function GuidePage() {
  return <GuideContent />;
}
