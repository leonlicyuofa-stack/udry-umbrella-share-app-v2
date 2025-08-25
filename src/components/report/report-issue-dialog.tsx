
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Camera, ShieldAlert, CheckCircle, Loader2, ArrowLeft, Phone } from 'lucide-react';
import { useAuth, useStalls } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context'; // Added

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
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (hasCameraPermission !== null || isCameraLoading) {
        setHasCameraPermission(null); 
        setIsCameraLoading(false);
    }
  }, [hasCameraPermission, isCameraLoading]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = translate('report_issue_camera_api_unavailable');
      setCameraError(errorMsg);
      setHasCameraPermission(false);
      setIsCameraLoading(false);
      toast({ variant: 'destructive', title: translate('report_issue_camera_error_title'), description: errorMsg });
      return;
    }
    setIsCameraLoading(true);
    setCameraError(null);
    setHasCameraPermission(null); 
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(playError => {
          console.warn("Video play interrupted or failed:", playError);
        });
      }
      setHasCameraPermission(true);
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let messageKey = 'report_issue_camera_error_desc_generic';
      if (error.name === "NotAllowedError") {
        messageKey = "report_issue_camera_permission_denied";
      } else if (error.name === "NotFoundError") {
        messageKey = "report_issue_camera_not_found";
      } else if (error.name === "NotReadableError") {
        messageKey = "report_issue_camera_in_use_or_error";
      }
      const translatedMessage = translate(messageKey);
      setCameraError(translatedMessage);
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: translate('report_issue_camera_error_title'), description: translatedMessage });
    } finally {
      setIsCameraLoading(false);
    }
  }, [toast, translate]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('selectIssue');
      setSelectedIssueType(null);
    } else {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  useEffect(() => {
    if (isOpen && currentStep === 'captureMedia') {
      startCamera();
    } else if (currentStep !== 'captureMedia') { 
      stopCamera();
    }
  }, [isOpen, currentStep, startCamera, stopCamera]);


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

  const handleCaptureMedia = () => {
    if (selectedIssueType === 'brokenUmbrella') {
      if (activeRental) { 
        const currentReportCount = incrementBrokenReportCount();
        endRental(activeRental.stallId); // Pass stalls

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
    }
    onOpenChange(false); 
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
        <div className="w-full aspect-video bg-muted rounded-md overflow-hidden relative shadow-inner border flex items-center justify-center">
          {isCameraLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          
          <video 
            ref={videoRef} 
            className={`w-full h-full object-cover ${(!hasCameraPermission || isCameraLoading || cameraError) ? 'hidden' : ''}`} 
            autoPlay 
            playsInline 
            muted 
          />
          
          {!isCameraLoading && hasCameraPermission === null && !cameraError && ( 
            <div className="text-center p-4 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{translate('report_issue_initializing_camera')}</p>
            </div>
          )}

          {!isCameraLoading && (hasCameraPermission === false || cameraError) && (
             <Alert variant="destructive" className="m-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{translate('report_issue_camera_error_title')}</AlertTitle>
              <AlertDescription>{cameraError || translate('report_issue_camera_error_desc_generic')}</AlertDescription>
            </Alert>
          )}
        </div>
        {hasCameraPermission === false && !isCameraLoading && (
            <Button onClick={startCamera} variant="outline" className="w-full">
                <Camera className="mr-2 h-4 w-4" /> {translate('report_issue_retry_camera_button')}
            </Button>
        )}
      </div>
      <DialogFooter className="mt-2">
        <Button variant="outline" onClick={handleBack}>{translate('report_issue_back_to_selection_button')}</Button>
        <Button 
            onClick={handleCaptureMedia} 
            disabled={!hasCameraPermission || isCameraLoading}
            className="bg-primary hover:bg-primary/90"
        >
          <CheckCircle className="mr-2 h-4 w-4" /> {translate('report_issue_confirm_report_button')}
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
          <Phone className="mr-2 h-6 w-6" />
          {translate('report_issue_contact_support_step_title')}
        </DialogTitle>
      </DialogHeader>
      <div className="py-6 space-y-4">
        <Alert>
          <Phone className="h-4 w-4" />
          <AlertTitle>{translate('report_issue_need_assistance_title')}</AlertTitle>
          <AlertDescription>
            {translate('report_issue_need_assistance_desc')}
          </AlertDescription>
        </Alert>
        
      </div>
      <DialogFooter className="mt-2 flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={() => {
            window.location.href = `tel:${CUSTOMER_SERVICE_NUMBER}`;
          }} 
          className="w-full sm:w-auto"
        >
          <Phone className="mr-2 h-4 w-4" /> {translate('report_issue_call_customer_service_button')}
        </Button>
        <Button 
          onClick={() => {
            window.open(`https://wa.me/852${CUSTOMER_SERVICE_NUMBER}`, '_blank');
          }} 
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
        >
          <WhatsAppIcon className="mr-2 h-4 w-4" /> WhatsApp
        </Button>
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
