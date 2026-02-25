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
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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
