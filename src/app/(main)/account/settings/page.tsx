"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, LogIn, UserCog, Save, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function ProfileSettingsPage() {
  const { user, isReady, changeUserPassword } = useAuth();
  const router = useRouter();
  const { translate } = useLanguage();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (isReady && !user) {
      router.replace('/auth/signin?redirect=/account/settings');
    } else if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user, isReady, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      // NOTE: In a real app, you would call an update function from your auth context here.
      // For now, this is a simulated success.
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      toast({ title: translate('profile_settings_update_success') });
    } catch (error: any) {
      toast({ 
        title: translate('profile_settings_update_error'), 
        description: error.message || translate('oops_error'), 
        variant: "destructive" 
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  async function onSubmitChangePassword(values: ChangePasswordFormData) {
    setIsChangingPassword(true);
    try {
      await changeUserPassword(values);
      // Success toast is handled in AuthContext
      changePasswordForm.reset();
    } catch (error) {
      // Error toast is handled in AuthContext
      console.error("Password change submission error:", error);
    } finally {
      setIsChangingPassword(false);
    }
  }

  // Use the isReady flag to show a consistent loading state
  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{translate('profile_settings_loading')}</p>
      </div>
    );
  }
  
  // This part handles the case where loading is done but there is no user
  if (!user) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <AlertTriangle className="mr-2 h-6 w-6" /> {translate('access_denied')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{translate('profile_settings_login_required')}</p>
            <Button asChild className="mt-4">
              <Link href="/auth/signin?redirect=/account/settings" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" /> {translate('login')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <UserCog className="mr-3 h-8 w-8" />
            {translate('profile_settings_title')}
          </CardTitle>
          <CardDescription>
            {translate('profile_settings_description')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileUpdate}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg">{translate('profile_settings_name_label')}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg h-12"
                disabled={isUpdatingProfile || isChangingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg">{translate('profile_settings_email_label')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                className="text-lg h-12 bg-muted/50"
                disabled
                readOnly
              />
               <p className="text-xs text-muted-foreground">{translate('profile_settings_email_unchangeable')}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUpdatingProfile || isChangingPassword}>
              {isUpdatingProfile ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {translate('profile_settings_update_button')}
            </Button>
          </CardFooter>
        </form>

        <Card className="bg-secondary/30 mt-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <KeyRound className="mr-2 h-5 w-5 text-accent" />
              {translate('change_password_title')}
            </CardTitle>
            <CardDescription>
              {translate('change_password_description')}
            </CardDescription>
          </CardHeader>
          <Form {...changePasswordForm}>
            <form onSubmit={changePasswordForm.handleSubmit(onSubmitChangePassword)}>
              <CardContent className="space-y-4">
                <FormField
                  control={changePasswordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('current_password_label')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isChangingPassword || isUpdatingProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={changePasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('new_password_label')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isChangingPassword || isUpdatingProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={changePasswordForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('confirm_new_password_label')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isChangingPassword || isUpdatingProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isChangingPassword || isUpdatingProfile}>
                  {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  {translate('profile_settings_change_password_button')}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

      </Card>
    </div>
  );
}
