
"use client"; // Ensure this component can use hooks

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, Search, QrCode, Timer, Smile, Camera } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context"; // Import useLanguage

const GuideStep = ({ icon, title, description, image, alt, aiHint }: { icon: React.ReactNode, title: string, description: string, image?: string, alt?: string, aiHint?: string }) => (
  <div className="flex flex-col md:flex-row items-start gap-6 p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="flex-shrink-0 text-primary">{icon}</div>
    <div className="flex-1">
      <h3 className="text-xl font-semibold mb-2 text-primary">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {image && alt && (
        <div className="mt-2 overflow-hidden rounded-md">
          <Image 
            src={image} 
            alt={alt} 
            width={300} 
            height={200} 
            className="object-cover transition-transform duration-300 hover:scale-105"
            data-ai-hint={aiHint || "technology usage"}
          />
        </div>
      )}
    </div>
  </div>
);

export function GuideContent() {
  const { translate } = useLanguage(); // Get the translate function

  const steps = [
    {
      icon: <MapPin size={32} />,
      title: translate('guide_step_1_title'),
      description: translate('guide_step_1_description'),
    },
    {
      icon: <Camera size={32} />, 
      title: translate('guide_step_2_title'),
      description: translate('guide_step_2_description'),
    },
    {
      icon: <Timer size={32} />,
      title: translate('guide_step_3_title'),
      description: translate('guide_step_3_description'),
    },
    {
      icon: <MapPin size={32} />,
      title: translate('guide_step_4_title'),
      description: translate('guide_step_4_description'),
    },
  ];

  const faqs = [
    {
      value: "item-1",
      trigger: translate('faq_q1_trigger'),
      content: translate('faq_q1_content'),
    },
    {
      value: "item-deposit",
      trigger: translate('faq_q2_trigger'),
      content: translate('faq_q2_content'),
    },
    {
      value: "item-2",
      trigger: translate('faq_q3_trigger'),
      content: translate('faq_q3_content'),
    },
    {
      value: "item-3",
      trigger: translate('faq_q4_trigger'),
      content: translate('faq_q4_content'),
    },
  ];

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">{translate('guide_welcome_title')}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {translate('guide_welcome_description')}
        </p>
      </section>

      <section className="space-y-6">
        {steps.map((step, index) => (
          <GuideStep key={index} {...step} />
        ))}
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-accent">{translate('guide_faq_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.value} value={faq.value}>
                  <AccordionTrigger className="text-base">{faq.trigger}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      <section className="text-center py-8 bg-secondary/30 rounded-lg">
        <Smile size={48} className="mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-semibold text-primary mb-2">{translate('guide_need_help_title')}</h2>
        <p className="text-muted-foreground">
          {translate('guide_need_help_description')}
        </p>
      </section>
    </div>
  );
}
