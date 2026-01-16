
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Camera, ShieldAlert, CheckCircle, Loader2, ArrowLeft, Phone, Bot, Info } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useStalls } from '@/contexts/stalls-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context'; // Added
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AIChatbot } from '@/components/report/ai-chatbot';
import { Separator } from '@/components/ui/separator';

// Custom WhatsApp Icon
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M16.75 13.96c.25.13.43.2.5.33.07.13.07.55-.02.68-.09.13-.55.37-1.02.55-.47.18-1.02.28-1.57.18-.55-.09-1.14-.37-1.68-.81-.55-.44-1.02-.96-1.4-1.57-.38-.61-.61-1.28-.61-1.97s-.18-1.28.09-1.82c.28-.55.96-1.14 1.57-1.14.61 0 1.09.28 1.28.55s.28 1.02.28 1.18c0 .16-.05.3-.09.39-.05.09-.09.13-.18.22-.09.09-.18.18-.28.28-.09.09-.13.13-.22.25-.09.13-.05.22 0 .34.14.28.5.83.96 1.28.47.44.96.81 1.28.96.13.05.22.05.34 0 .13-.09.22-.18.25-.22s.13-.18.22-.09c.09.09.3.18.39.28s.18.18.22.25.09.18.05.28c-.05.09-.09.13-.13.13zM12 2a10 10 0 100 20 10 10 0 000-20zm0 18.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5z"/>
    </svg>
);


type ReportStep = 'selectIssue' | 'captureMedia' | 'confirmLostStolen' | 'contactSupportStep';
type IssueType = 'lostOrStolen' | 'brokenUmbrella' | 'contactSupport' | null;

const BROKEN_REPORT_STORAGE_KEY = 'udry_broken_reports';
const CUSTOMER_SERVICE_NUMBER = "97373875";
const CUSTOMER_SERVICE_NUMBER_DISPLAY = "9737-3875";


interface ReportIssueDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface BrokenReportInfo {
  date: string; // YYYY-MM-DD
  count: number;
}

export function ReportIssueDialog({ isOpen, onOpenChange }: ReportIssueDialogProps) {
  const { user, activeRental, endRental } = useAuth();
  const { stalls } = useStalls(); // Fetch stalls
  const { toast } = useToast();
  const { translate } = useLanguage(); // Added

  const [currentStep, setCurrentStep] = useState<ReportStep>('selectIssue');
  const [selectedIssueType, setSelectedIssueType] = useState<IssueType>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('selectIssue');
      setSelectedIssueType(null);
    }
  }, [isOpen]);

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getBrokenReportInfo = (): BrokenReportInfo => {
    try {
      const storedInfo = localStorage.getItem(BROKEN_REPORT_STORAGE_KEY);
      if (storedInfo) {
        const parsedInfo: BrokenReportInfo = JSON.parse(storedInfo);
        if (parsedInfo.date === getTodayDateString()) {
          return parsedInfo;
        }
      }
    } catch (e) {
      console.error("Error reading broken report info from localStorage", e);
    }
    return { date: getTodayDateString(), count: 0 };
  };

  const incrementBrokenReportCount = (): number => {
    let reportInfo = getBrokenReportInfo();
    if (reportInfo.date !== getTodayDateString()) {
      reportInfo = { date: getTodayDateString(), count: 1 };
    } else {
      reportInfo.count += 1;
    }
    try {
      localStorage.setItem(BROKEN_REPORT_STORAGE_KEY, JSON.stringify(reportInfo));
    } catch (e) {
      console.error("Error saving broken report info to localStorage", e);
    }
    return reportInfo.count;
  };

  const handleIssueSelect = (issueType: IssueType) => {
    setSelectedIssueType(issueType);
    if (!user && issueType !== 'contactSupport') { 
        toast({ 
          title: translate('report_issue_toast_auth_required_title'), 
          description: translate('report_issue_toast_auth_required_desc'), 
          variant: "destructive" 
        });
        onOpenChange(false);
        return;
    }

    if (issueType === 'lostOrStolen') {
      if (!activeRental) {
        toast({ 
          title: translate('report_issue_toast_no_active_rental_title'), 
          description: translate('report_issue_toast_no_active_rental_desc'), 
          variant: "destructive" 
        });
        return; 
      }
      setCurrentStep('confirmLostStolen');
    } else if (issueType === 'brokenUmbrella') {
      setCurrentStep('captureMedia');
    } else if (issueType === 'contactSupport') {
      setCurrentStep('contactSupportStep');
    }
  };

  const handleConfirmLostOrStolen = () => {
    if (activeRental) {
      endRental(activeRental.stallId); // Pass stalls
      toast({
        title: translate('report_issue_toast_lost_stolen_title'),
        description: translate('report_issue_toast_lost_stolen_desc'),
        variant: "default",
        duration: 7000,
      });
    }
    onOpenChange(false); 
  };

  const handleReportBroken = async () => {
    setIsProcessing(true);
    try {
      const permissionStatus = await CapacitorCamera.checkPermissions();
      if (permissionStatus.camera !== 'granted') {
        const newStatus = await CapacitorCamera.requestPermissions({ permissions: ['camera'] });
        if (newStatus.camera !== 'granted') {
          toast({
            variant: 'destructive',
            title: translate('report_issue_camera_error_title'),
            description: translate('report_issue_camera_permission_denied'),
          });
          setIsProcessing(false);
          return;
        }
      }

      // We don't actually need to take a photo, just confirm permission.
      // In a real app, you would take a photo here:
      // const image = await CapacitorCamera.getPhoto({
      //   quality: 90,
      //   allowEditing: false,
      //   resultType: CameraResultType.Uri,
      //   source: CameraSource.Camera
      // });

      if (activeRental) { 
        const currentReportCount = incrementBrokenReportCount();
        endRental(activeRental.stallId);

        if (currentReportCount >= 2) {
          toast({
            title: translate('report_issue_toast_multiple_broken_title'),
            description: translate('report_issue_toast_multiple_broken_desc', { count: currentReportCount, customerServiceNumber: CUSTOMER_SERVICE_NUMBER_DISPLAY }),
            variant: "destructive",
            duration: 10000,
          });
        } else { 
          toast({
            title: translate('report_issue_toast_broken_rented_title'),
            description: translate('report_issue_toast_broken_rented_desc'),
            variant: "default",
            duration: 10000,
          });
        }
      } else { 
        toast({
          title: translate('report_issue_toast_report_submitted_title'),
          description: translate('report_issue_toast_report_submitted_desc'),
          variant: "default",
          duration: 5000,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error reporting broken item:", error);
      toast({
        variant: 'destructive',
        title: translate('error_title'),
        description: translate('oops_error'),
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBack = () => {
    if (currentStep === 'captureMedia' || currentStep === 'confirmLostStolen' || currentStep === 'contactSupportStep') {
      setCurrentStep('selectIssue');
      setSelectedIssueType(null);
    }
  }

  const renderSelectIssueStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center text-xl text-primary">
          <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
          {translate('report_issue_dialog_title')}
        </DialogTitle>
        <DialogDescription>
          {translate('report_issue_dialog_select_description')}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-4">
        <Button variant="outline" className="w-full justify-start py-6 text-left h-auto text-sm" onClick={() => handleIssueSelect('lostOrStolen')}>
          <ShieldAlert className="mr-3 h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{translate('report_issue_lost_stolen_button')}</p>
            <p className="text-xs text-muted-foreground">{translate('report_issue_lost_stolen_description')}</p>
          </div>
        </Button>
        <Button variant="outline" className="w-full justify-start py-6 text-left h-auto text-sm" onClick={() => handleIssueSelect('brokenUmbrella')}>
          <Camera className="mr-3 h-5 w-5 text-orange-500 flex-shrink-0" />
           <div className="flex-1 min-w-0">
            <p className="font-semibold">{translate('report_issue_broken_button')}</p>
            <p className="text-xs text-muted-foreground">{translate('report_issue_broken_description')}</p>
          </div>
        </Button>
        <Button variant="outline" className="w-full justify-start py-6 text-left h-auto text-sm" onClick={() => handleIssueSelect('contactSupport')}>
          <Phone className="mr-3 h-5 w-5 text-green-600 flex-shrink-0" />
           <div className="flex-1 min-w-0">
            <p className="font-semibold">{translate('report_issue_contact_support_button')}</p>
            <p className="text-xs text-muted-foreground">{translate('report_issue_contact_support_description')}</p>
          </div>
        </Button>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">{translate('cancel_button')}</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );

  const renderConfirmLostStolenStep = () => (
    <>
      <DialogHeader>
         <Button variant="ghost" size="sm" onClick={handleBack} className="absolute left-4 top-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> {translate('back_button')}
         </Button>
        <DialogTitle className="flex items-center text-xl text-destructive justify-center pt-8">
          <ShieldAlert className="mr-2 h-6 w-6" />
          {translate('report_issue_confirm_lost_stolen_title')}
        </DialogTitle>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{translate('report_issue_important_notice_title')}</AlertTitle>
          <AlertDescription>
            {translate('report_issue_confirm_lost_stolen_alert_desc')}
          </AlertDescription>
        </Alert>
        {activeRental && (
            <Card className="bg-muted/50">
                <CardContent className="p-3 text-sm">
                    <p><strong>{translate('report_issue_current_rental_label')}</strong> {activeRental.stallName}</p>
                    <p><strong>{translate('report_issue_started_label')}</strong> {new Date(activeRental.startTime).toLocaleString()}</p>
                </CardContent>
            </Card>
        )}
      </div>
      <DialogFooter className="mt-2">
        <Button variant="ghost" onClick={handleBack}>{translate('report_issue_back_to_selection_button')}</Button>
        <Button variant="destructive" onClick={handleConfirmLostOrStolen}>
          {translate('report_issue_yes_report_lost_stolen_button')}
        </Button>
      </DialogFooter>
    </>
  );

  const renderCaptureMediaStep = () => (
    <>
      <DialogHeader>
         <Button variant="ghost" size="sm" onClick={handleBack} className="absolute left-4 top-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> {translate('back_button')}
         </Button>
        <DialogTitle className="flex items-center text-xl text-primary justify-center pt-8">
          <Camera className="mr-2 h-6 w-6" />
          {translate('report_issue_capture_media_title')}
        </DialogTitle>
        <DialogDescription className="text-center">
         {translate('report_issue_capture_media_desc')}
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <div className="w-full aspect-video bg-muted rounded-md overflow-hidden relative shadow-inner border flex items-center justify-center p-4 text-center">
            <div className="text-muted-foreground space-y-2">
                <Camera className="h-12 w-12 mx-auto opacity-50" />
                <p>Clicking the button below will open the native camera.</p>
                <p className="text-xs">This action confirms your report. In a real app, you would take a photo before confirming.</p>
            </div>
        </div>
      </div>
      <DialogFooter className="mt-2">
        <Button variant="outline" onClick={handleBack}>{translate('report_issue_back_to_selection_button')}</Button>
        <Button 
            onClick={handleReportBroken} 
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90"
        >
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          {translate('report_issue_confirm_report_button')}
        </Button>
      </DialogFooter>
    </>
  );

  const renderContactSupportStep = () => (
    <>
      <DialogHeader>
        <Button variant="ghost" size="sm" onClick={handleBack} className="absolute left-4 top-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> {translate('back_button')}
        </Button>
        <DialogTitle className="flex items-center text-xl text-primary justify-center pt-8">
          <Bot className="mr-2 h-6 w-6" />
          {translate('report_issue_contact_support_step_title')}
        </DialogTitle>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{translate('report_issue_need_assistance_title')}</AlertTitle>
          <AlertDescription>
            Try asking our new AI assistant first. If it can't help, you can still call or use WhatsApp.
          </AlertDescription>
        </Alert>
        <AIChatbot />
      </div>
      <DialogFooter className="mt-2 flex flex-col gap-2">
        <Separator className="my-2" />
        <p className="text-xs text-center text-muted-foreground">Still need help?</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => {
              window.location.href = `tel:${CUSTOMER_SERVICE_NUMBER}`;
            }}
            className="w-full sm:flex-1"
            variant="outline"
          >
            <Phone className="mr-2 h-4 w-4" /> {translate('report_issue_call_customer_service_button')}
          </Button>
          <Button
            onClick={() => {
              window.open(`https://wa.me/852${CUSTOMER_SERVICE_NUMBER}`, '_blank');
            }}
            className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <WhatsAppIcon className="mr-2 h-4 w-4" /> WhatsApp
          </Button>
        </div>
      </DialogFooter>
    </>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 'selectIssue':
        return renderSelectIssueStep();
      case 'confirmLostStolen':
        return renderConfirmLostStolenStep();
      case 'captureMedia':
        return renderCaptureMediaStep();
      case 'contactSupportStep':
        return renderContactSupportStep();
      default:
        return <p>Something went wrong.</p>;
    }
  };

  return (
    <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
            onOpenChange(open);
        }}
    >
      <DialogContent className="sm:max-w-md bg-background shadow-xl rounded-lg">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

    